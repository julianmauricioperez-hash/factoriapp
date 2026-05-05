import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.57.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CreateSchema = z.object({
  action: z.literal("create"),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  is_admin: z.boolean().optional().default(false),
});

const UpdateSchema = z.object({
  action: z.literal("update"),
  user_id: z.string().uuid(),
  email: z.string().trim().email().max(255).optional(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  is_admin: z.boolean().optional(),
});

const DeleteSchema = z.object({
  action: z.literal("delete"),
  user_id: z.string().uuid(),
});

const BodySchema = z.discriminatedUnion("action", [CreateSchema, UpdateSchema, DeleteSchema]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerId = claimsData.claims.sub as string;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten() }, 400);
    }
    const body = parsed.data;

    if (body.action === "create") {
      const { data, error } = await admin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
      });
      if (error) return jsonResponse({ error: error.message }, 400);

      if (body.is_admin && data.user) {
        const { error: rErr } = await admin
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "admin" });
        if (rErr) return jsonResponse({ error: rErr.message }, 400);
      }
      return jsonResponse({ ok: true, user_id: data.user?.id });
    }

    if (body.action === "update") {
      if (body.user_id === callerId && body.is_admin === false) {
        return jsonResponse({ error: "No puedes quitarte tu propio rol de administrador" }, 400);
      }

      const updates: { email?: string; password?: string } = {};
      if (body.email) updates.email = body.email;
      if (body.password) updates.password = body.password;

      if (Object.keys(updates).length > 0) {
        const { error } = await admin.auth.admin.updateUserById(body.user_id, updates);
        if (error) return jsonResponse({ error: error.message }, 400);
      }

      if (typeof body.is_admin === "boolean") {
        if (body.is_admin) {
          // upsert admin role (ignore conflict via select-then-insert)
          const { data: existing } = await admin
            .from("user_roles")
            .select("id")
            .eq("user_id", body.user_id)
            .eq("role", "admin")
            .maybeSingle();
          if (!existing) {
            const { error: rErr } = await admin
              .from("user_roles")
              .insert({ user_id: body.user_id, role: "admin" });
            if (rErr) return jsonResponse({ error: rErr.message }, 400);
          }
        } else {
          const { error: rErr } = await admin
            .from("user_roles")
            .delete()
            .eq("user_id", body.user_id)
            .eq("role", "admin");
          if (rErr) return jsonResponse({ error: rErr.message }, 400);
        }
      }
      return jsonResponse({ ok: true });
    }

    if (body.action === "delete") {
      if (body.user_id === callerId) {
        return jsonResponse({ error: "No puedes eliminar tu propia cuenta" }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (e) {
    console.error("admin-users error:", e);
    return jsonResponse({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
