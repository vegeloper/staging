import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { connection } from "next/server";

import { defaultPublishedSite, type PublishedSite } from "./defaults";
import { loadPublishedSite } from "./store";

const readCachedPublishedSite = unstable_cache(
  async () => loadPublishedSite(),
  ["published-site-settings"],
  { tags: ["site-settings"], revalidate: false },
);

export async function getPublishedSiteSettings(): Promise<PublishedSite> {
  await connection();
  if (process.env.NEXT_PHASE === "phase-production-build" || !process.env.DATABASE_URL) {
    return {
      ...defaultPublishedSite,
      theme: {
        colors: { ...defaultPublishedSite.theme.colors },
        background: { ...defaultPublishedSite.theme.background },
        media: { ...defaultPublishedSite.theme.media },
      },
    };
  }

  try {
    return await readCachedPublishedSite();
  } catch (error) {
    console.error("Published site settings are unavailable.", error);
    return {
      ...defaultPublishedSite,
      theme: {
        colors: { ...defaultPublishedSite.theme.colors },
        background: { ...defaultPublishedSite.theme.background },
        media: { ...defaultPublishedSite.theme.media },
      },
    };
  }
}

export function invalidatePublishedSite() {
  // { expire: 0 } drops the previous value immediately. The next request
  // waits for a fresh read and stores that result. "max" would keep serving
  // the old theme for up to a year. This runs inside the web process, so the
  // Docker container does not restart.
  revalidateTag("site-settings", { expire: 0 });
  revalidatePath("/", "layout");
}
