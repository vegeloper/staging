export type ThemeColors = {
  brand: string;
  brandDark: string;
  ink: string;
  paper: string;
  surface: string;
  hero: string;
};

export type SiteTheme = {
  colors: ThemeColors;
  background: {
    image: string;
  };
  media: {
    logo: string;
    logoFooter: string;
    footerLogo: string;
    heroImage: string;
    campaignVideo: string;
    campaignPoster: string;
  };
};

export const DEFAULT_COPYRIGHT =
  "تمامی حقوق این سایت متعلق به شرکت دات وان تریپ می باشد";

export const defaultTheme: SiteTheme = {
  colors: {
    brand: "#00b7ce",
    brandDark: "#0093a5",
    ink: "#171717",
    paper: "#ffffff",
    surface: "#ffffff",
    hero: "#00b7ce",
  },
  background: {
    image: "",
  },
  media: {
    logo: "",
    logoFooter: "",
    footerLogo: "",
    heroImage: "",
    campaignVideo: "",
    campaignPoster: "",
  },
};

export const builtinMedia = {
  logo: "/figma/logo.png",
  logoFooter: "/figma/logo-footer.png",
  footerLogo: "/figma/DotOneTrip-Logo.png",
  heroImage: "/figma/journey.png",
  campaignVideo: "/videos/campainHero.mp4",
  campaignPoster: "/videos/campainVideoPoster.png",
} as const;

export function resolvedMedia(theme: SiteTheme) {
  return {
    logo: theme.media.logo || builtinMedia.logo,
    logoFooter: theme.media.logoFooter || builtinMedia.logoFooter,
    footerLogo: theme.media.footerLogo || builtinMedia.footerLogo,
    heroImage: theme.media.heroImage || builtinMedia.heroImage,
    campaignVideo: theme.media.campaignVideo || builtinMedia.campaignVideo,
    campaignPoster: theme.media.campaignPoster || builtinMedia.campaignPoster,
  };
}

export type PublishedSite = {
  theme: SiteTheme;
  copyright: string;
  themeRevision: number;
  copyrightRevision: number;
};

export const defaultPublishedSite: PublishedSite = {
  theme: defaultTheme,
  copyright: DEFAULT_COPYRIGHT,
  themeRevision: 0,
  copyrightRevision: 0,
};

export function themeStyleVars(theme: SiteTheme): Record<string, string> {
  return {
    "--brand": theme.colors.brand,
    "--brand-dark": theme.colors.brandDark,
    "--ink": theme.colors.ink,
    "--paper": theme.colors.paper,
    "--surface": theme.colors.surface,
    "--hero": theme.colors.hero,
    "--page-image": theme.background.image ? `url("${theme.background.image}")` : "none",
  };
}
