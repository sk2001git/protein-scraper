/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler deploy --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

import { ScheduledController } from "@cloudflare/workers-types/experimental";
import { ExecutionContext } from "@cloudflare/workers-types/experimental";
import { scrapeAndReturnAllProductUrls } from "./recursive_scraper/categorical_scrape";
import { createClient} from "@supabase/supabase-js";

export interface Env {
  CRON_SECRET: string;
  NEXTJS_API_URL: string; 
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  WORKER_URL: string;  // Add this line
}

// npx wrangler dev my-worker/src/index.ts --test-scheduled   command to test

// Should probably hit the wrangler website again and again with multiple inputs i think
//Exceeded CPU Time Limits
//Exceeded Memory

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await this.processUrlBatch(0, env);
  },

  async processUrlBatch(
    offset: number,
    env: Env
  ): Promise<void> {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const BATCH_SIZE = 5;
    const MAX_CONCURRENT_REQUESTS = 3;

    const { data, error } = await supabase
      .from('urls')
      .select('url')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error("Error fetching URLs:", error);
      return;
    }

    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = data.slice(i, i + MAX_CONCURRENT_REQUESTS);
        await Promise.all(batch.map(({ url }) =>
          fetch(new Request(env.WORKER_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cron-Secret': env.CRON_SECRET,
            },
            body: JSON.stringify({ url }),
          }))
        ));
      }
  
      if (data.length === BATCH_SIZE) {
        setTimeout(() => {
          this.processUrlBatch(offset + BATCH_SIZE, env);
        }, 0);
      }
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/favicon.ico') {
      return new Response(null, { status: 200 });
    }

    if (request.method === 'POST') {
      try {
        const { url } = await request.json() as { url: string };
        const apiUrl = `${env.NEXTJS_API_URL}/api/scrape?url=${url}`;
        console.log(`Calling API for ${url} at ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cron-Secret': env.CRON_SECRET,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to call API for ${url}: ${response.statusText}`);
        }

        console.log(`Successfully called API for ${url}`);
        return new Response(`Processed ${url}`, { status: 200 });
      } catch (error) {
        console.error(`Error processing URL: ${(error as Error).message}`);
        return new Response(`Error: ${(error as Error).message}`, { status: 500 });
      }
    }

    if (request.method === 'GET') {
      console.log('Fetch handler invoked');
      await this.scheduled({} as ScheduledController, env, {} as ExecutionContext);
      return new Response("Fetch handler executed", {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  }
};