import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { authorization: authHeader } } },
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Token inválido" }, 401);

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || !["admin", "coordenador"].includes(callerProfile.role)) {
      return json({ error: "Sem permissão" }, 403);
    }

    const { email, display_name, role } = await req.json();
    if (!email || !display_name || !role) return json({ error: "Campos obrigatórios: email, display_name, role" }, 400);

    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { display_name, role },
    });
    if (createErr) return json({ error: createErr.message }, 400);

    await supabaseAdmin.from("profiles").upsert({
      id: newUser.user.id,
      email,
      display_name,
      role,
      is_active: true,
      theme: "dark",
    });

    return json({ ok: true, userId: newUser.user.id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
