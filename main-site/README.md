# 一人公司落地页 MVP · One-Person Company Landing MVP

> BayAIU · OPCS 第 1 节课的现场作品。约 1 小时,用 AI 编程工具(Claude Code)从零做一个**落地页 + 留资系统**并部署上线。
> Built live in OPCS Lesson 1 — a landing page + lead capture, shipped in ~1 hour with AI.

这是 [bayaiu.ai](https://bayaiu.ai) 的精简原型:一个落地页、一个留资表单、一个把留资写进数据库的后端、一键部署上线。

---

## 这个仓库怎么用 / Branches

| 分支 | 用途 |
|---|---|
| `starter` | **课上从这里开始**。脚手架就绪,核心逻辑留成 `// TODO`,跟着讲师/实操手册一步步填。 |
| `final` | **完成版**。卡住了就对照它。本目录的代码就是 `final`。 |

> 维护者:把本目录推到 GitHub 作为 `final`;再建一个 `starter` 分支,把下面 4 个 `LIVE-BUILD 步骤` 处的代码替换成 `// TODO`,留给学员现场填。

代码里搜 `LIVE-BUILD` 能看到 4 个现场构建点:
1. **步骤 1** — `supabase/schema.sql`:建 `leads` 表。
2. **步骤 2** — `app/page.tsx`:落地页。
3. **步骤 3** — `components/LeadForm.tsx`:留资表单。
4. **步骤 4** — `app/api/lead/route.ts` + `lib/supabase.ts`:后端写库。

---

## 本地跑起来 / Run locally

```bash
npm install
cp .env.example .env.local   # 然后填入你的 Supabase 值
npm run dev                  # 打开 http://localhost:3000
```

### 1. 建数据库表

1. 去 [supabase.com](https://supabase.com) 新建项目。
2. 打开 **SQL Editor**,粘贴运行 [`supabase/schema.sql`](supabase/schema.sql)。

### 2. 配环境变量

在 Supabase **Settings → API** 复制两个值到 `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的-service-role-key
```

> ⚠️ `service_role` key 权限很大,**只放在服务器端**(本项目只在 `lib/supabase.ts` / API 路由里用),绝不要提交到 git、绝不要放进前端。`.gitignore` 已忽略 `.env*.local`。

---

## 部署上线 / Deploy (Cloudflare Workers)

本项目用 [OpenNext](https://opennext.js.org/cloudflare) 把 Next.js 部署到 **Cloudflare Workers**(和 bayaiu.ai 同一套)。仓库里已经配好 `wrangler.jsonc` 和 `open-next.config.ts`,你只要三步:

```bash
# 1) 一次性:登录 Cloudflare(会打开浏览器授权)
npx wrangler login

# 2) 第一次部署:创建 Worker 并拿到你的网址(这一步后落地页就能打开)
npm run deploy

# 3) 配置运行时密钥,让留资能写库(Worker 已存在,不会有多余提示)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY   # 粘贴你的 key,回车
```

第 2 步完成后终端会打印你的网址:`https://opc-onepager.<你的子域>.workers.dev` 🎉

- 顺序很关键:**先 `npm run deploy` 创建 Worker,再 `wrangler secret put`**——密钥不能配到一个还不存在的 Worker 上。
- 配好密钥后留资即可写库;若表单仍报错,再 `npm run deploy` 一次让密钥生效。
- `npm run deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`。
- `NEXT_PUBLIC_SUPABASE_URL` 在**构建时**就打包进代码(来自 `.env.local`),线上不用单独配。
- 想在本地预览 Worker 版本:`npm run preview`。

---

## 技术栈 / Stack

Next.js 15(App Router + TypeScript) · Tailwind CSS · Supabase · Cloudflare Workers(OpenNext)

## 排错 FAQ

| 现象 | 排查 |
|---|---|
| 提交表单报 500 | `.env.local` 是否填对?表是否建了?线上是否 `wrangler secret put` 了 service role key? |
| 页面没样式 | Tailwind:确认 `npm install` 成功、`postcss.config.mjs` 在根目录。 |
| `gen_random_uuid()` 报错 | 旧 Postgres 需 `create extension if not exists pgcrypto;`,Supabase 默认已开。 |
| 部署成功但留资进不去库 | 线上密钥要用 `wrangler secret put` 配;改完要重新 `npm run deploy` 才生效。 |
| `npm run deploy` 报 nodejs_compat 相关错 | 确认 `wrangler.jsonc` 里有 `"compatibility_flags": ["nodejs_compat"]`(本仓库已配好)。 |
| `wrangler login` 没反应 | 手动复制终端打印的链接到浏览器完成授权。 |

---

*MIT License · 拿去改成你自己的一人公司。*
