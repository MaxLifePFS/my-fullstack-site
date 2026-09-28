import { createClient } from "@supabase/supabase-js";

// ⬇️ LIVE-BUILD 步骤 4(后端):服务端 Supabase 客户端。
// service role key 只在服务器上用,绝不要放进前端代码。
// 惰性创建:只在收到请求时才读 env,这样没配 env 也能 build。
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
