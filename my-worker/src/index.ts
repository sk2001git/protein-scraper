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

export interface Env {
  CRON_SECRET: string;
  NEXTJS_API_URL: string; 
}



export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const urls = [
      'https://www.myprotein.com.sg/sports-nutrition/crispy-protein-wafer/10961185.html',
      'https://www.myprotein.com.sg/sports-nutrition/impact-whey-protein-powder/10530943.html',
      'https://www.myprotein.com.sg/sports-nutrition/clear-whey-protein-powder/12081395.html',
    ];

    for (const url of urls) {
      try {
        const apiUrl = `${env.NEXTJS_API_URL}/api/scrape?url=${url}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'cron-secret': env.CRON_SECRET,
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
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    await this.scheduled({} as ScheduledController, env, {} as ExecutionContext);
    return new Response("Scheduled task executed", {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
};