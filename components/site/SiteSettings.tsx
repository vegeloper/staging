"use client";

import { createContext, useContext } from "react";

import { defaultPublishedSite, type PublishedSite } from "@/lib/site/defaults";

const SiteSettingsContext = createContext<PublishedSite>(defaultPublishedSite);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: PublishedSite;
  children: React.ReactNode;
}) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
