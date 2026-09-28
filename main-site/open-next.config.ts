import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext 把 Next.js 适配成 Cloudflare Worker。
// 默认配置足够本课用;以后要加缓存/队列再在这里扩展。
export default defineCloudflareConfig();
