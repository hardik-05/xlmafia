export const SITE_NAME = "XLRI Notes Portal";

export const SUPPORT_EMAIL = "work.ai.hardik@gmail.com";

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "XLRI Notes Portal - Support",
)}`;

export const REPO_URL = "https://github.com/hardik-05/xlmafia";

export interface Contributor {
  name: string;
  role: string;
  handle: string;
  url: string;
}

// Two entries, identical for now - edit as the team grows.
export const CONTRIBUTORS: Contributor[] = [
  {
    name: "Hardik Choudhary",
    role: "Design & Development",
    handle: "metahdk",
    url: "https://github.com/hardik-05",
  },
  {
    name: "Hardik Choudhary",
    role: "Design & Development",
    handle: "metahdk",
    url: "https://github.com/hardik-05",
  },
];
