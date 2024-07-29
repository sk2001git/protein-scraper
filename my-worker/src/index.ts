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
}

// npx wrangler dev my-worker/src/index.ts --test-scheduled   command to test


export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    // const urls = await scrapeAndReturnAllProductUrls(supabase);
    const {data, error} = await supabase.from('urls').select('url')
    const fetchApi = async (url: string) => {
      try {
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
          console.error(`Failed to call API for ${url}:`, response.statusText);
        } else {
          console.log(`Successfully called API for ${url}`);
        }
      } catch (error) {
        console.error(`Error calling API for ${url}:`, error);
      }
    };
    
    if (data) {
      for (const url of data) {
        await fetchApi(url.url);
      }
    }
    // await Promise.all(urls.map(url => fetchApi(url)));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/favicon.ico') {
      return new Response(null, { status: 200 });
    }
    if (request.method === 'GET') {
      console.log('Fetch handler invoked');
      await this.scheduled( {} as ScheduledController, env, {} as ExecutionContext);
 
      return new Response("Fetch handler executed", {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  }
};