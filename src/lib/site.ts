export const SITE_NAME = "XL Notes";

/** Shown to everyone (including before sign-in). */
export const PUBLIC_SUPPORT_EMAIL = "work.ai.hardik@gmail.com";
export const PUBLIC_SUPPORT_MAILTO = `mailto:${PUBLIC_SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "XL Notes - Support",
)}`;

const DOMAIN = "astra.xlri.ac.in";

/** mailto: for a person's institute handle (handle only; email never displayed). */
export function handleMailto(handle: string, subject = "XL Notes"): string {
  return `mailto:${handle}@${DOMAIN}?subject=${encodeURIComponent(subject)}`;
}

/** Support routing - only shown to signed-in users; labels only, no addresses. */
export interface SupportContact {
  email: string;
  label: string;
}
export const SUPPORT_CONTACTS: SupportContact[] = [
  { email: "xof26036@astra.xlri.ac.in", label: "Notes-related issues" },
  { email: "xof26019@astra.xlri.ac.in", label: "Portal-related issues" },
  { email: "work.ai.hardik@gmail.com", label: "Suggestions" },
];

export interface Person {
  name: string;
  role: string;
  handle: string;
}

export const CRS: Person[] = [
  { name: "Divisha", role: "Class representative", handle: "xof26015b" },
  { name: "Aditya", role: "Class representative", handle: "xof26001" },
];

export const CONTRIBUTORS: Person[] = [
  { name: "Satvik", role: "Notes & curation", handle: "xof26036" },
  { name: "Hardik", role: "Design & development", handle: "xof26019" },
];

export const BATCH_LABEL = "Batch of 2026-28";
export const BATCH_MOTTO = "Alone we cram. Together we ace.";
export const BATCH_PHOTO = "/batch-26-28.jpg";
