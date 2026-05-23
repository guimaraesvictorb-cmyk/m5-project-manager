import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { ShareToken } from "../lib/database.types";

export type { ShareToken };

export function useShareTokens(clientId: string) {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase
      .from("client_share_tokens")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setTokens(data ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function createToken(label?: string, expiresInDays?: number) {
    const expires_at = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null;
    const { data: user } = await supabase.auth.getUser();
    const { data } = await supabase.from("client_share_tokens").insert({
      client_id: clientId,
      label: label || null,
      expires_at,
      created_by: user.user?.id,
    }).select().single();
    if (data) setTokens((prev) => [data, ...prev]);
  }

  async function deleteToken(id: string) {
    await supabase.from("client_share_tokens").delete().eq("id", id);
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }

  return { tokens, loading, createToken, deleteToken, refetch: fetch };
}
