				import worker, * as OTHER_EXPORTS from "C:\\Users\\gunda\\OneDrive\\Desktop\\main-project\\proteinscraper\\proteinscraper\\my-worker\\src\\index.ts";
				import * as __MIDDLEWARE_0__ from "C:\\Users\\gunda\\OneDrive\\Desktop\\main-project\\proteinscraper\\proteinscraper\\node_modules\\wrangler\\templates\\middleware\\middleware-ensure-req-body-drained.ts";
import * as __MIDDLEWARE_1__ from "C:\\Users\\gunda\\OneDrive\\Desktop\\main-project\\proteinscraper\\proteinscraper\\node_modules\\wrangler\\templates\\middleware\\middleware-scheduled.ts";
import * as __MIDDLEWARE_2__ from "C:\\Users\\gunda\\OneDrive\\Desktop\\main-project\\proteinscraper\\proteinscraper\\node_modules\\wrangler\\templates\\middleware\\middleware-miniflare3-json-error.ts";

				export * from "C:\\Users\\gunda\\OneDrive\\Desktop\\main-project\\proteinscraper\\proteinscraper\\my-worker\\src\\index.ts";

				export const __INTERNAL_WRANGLER_MIDDLEWARE__ = [
					...(OTHER_EXPORTS.__INJECT_FOR_TESTING_WRANGLER_MIDDLEWARE__ ?? []),
					__MIDDLEWARE_0__.default,__MIDDLEWARE_1__.default,__MIDDLEWARE_2__.default
				]
				export default worker;