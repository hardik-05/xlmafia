import type { CookieOptions } from "@supabase/ssr";

/**
 * Shape of a single entry passed to a Supabase `setAll` cookie adapter.
 * Declared explicitly because TS does not always contextually type the
 * `setAll` parameter through the createServerClient options union.
 */
export type CookieToSet = { name: string; value: string; options: CookieOptions };
