"use client";
import { SILENT_HEADER } from "@/components/loader/loader-store";
/** Small fetch helper: JSON in, JSON out, readable errors. Shows the global loader unless `silent` is set. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown; silent?: boolean }): Promise<T> {
  const { json, silent, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (json !== undefined) headers.set("content-type", "application/json");
  if (silent) headers.set(SILENT_HEADER, "1");
  const res = await fetch(url, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status}).`);
  return data as T;
}
