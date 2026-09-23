"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import PublicImage from "@/components/site/PublicImage";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ChevronDown, ChevronLeft, Download, Menu, X } from "lucide-react";

import ShakeHand from "@/public/figma/agreement.png";
import { useSiteSettings } from "@/components/site/SiteSettings";
import { resolvedMedia } from "@/lib/site/defaults";

import styles from "./Header.module.css";

const DOWNLOAD_BANNER_HREF = "/#download-banner";
const DOWNLOAD_BANNER_ID = "download-banner";

function scrollToDownloadBanner() {
  document.getElementById(DOWNLOAD_BANNER_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

type HeaderProps = {
  variant?: "light" | "dark";
};

type NavChild = {
  label: string;
  href: string;
};

type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  {
    label: "صفحه اصلی",
    href: "/",
  },

  {
    label: "خدمات",
    href: "/services",
    children: [
      {
        label: "حمل و نقل شهری",
        href: "/services",
      },
      {
        label: "حمل‌ونقل سازمانی",
        href: "/b2b",
      },
      {
        label: "سرویس در اختیار",
        href: "/oncall",
      },
    ],
  },

  {
    label: "ناوگان",
    href: "/vehicles",
  },

  {
    label: "اخبار",
    href: "/blog",
  },

  {
    label: "درباره تریپ",
    href: "/about",
  },
  {
    label: "به ما بپیوندید",
    href: "/join-us",
    children: [

      {
        label: "همکاری با رانندگان",
        href: "/join-us/drivers",
      },
      {
        label: "همکاری با تریپ",
        href: "https://apply.dotone.ir/",
      },
    ],
  },
  {
    label: "تماس با ما",
    href: "/contact-us",
  },
  {
    label: "کمپین",
    href: "/campaign",
  },
];

export default function Header({ variant = "light" }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const pathname = usePathname();
  const media = resolvedMedia(useSiteSettings().theme);

  const isLightVariant = variant === "light";

  useEffect(() => {
    setMenuOpen(false);
    setOpenSubmenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;

    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu((current) => (current === label ? null : label));
  };

  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const scrollIfHashed = () => {
      if (window.location.hash !== `#${DOWNLOAD_BANNER_ID}`) return;
      scrollToDownloadBanner();
    };

    const frame = window.requestAnimationFrame(scrollIfHashed);
    const timer = window.setTimeout(scrollIfHashed, 80);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  const goToDownloadBanner = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    setOpenSubmenu(null);

    if (pathname === "/") {
      scrollToDownloadBanner();
      return;
    }

    router.push(DOWNLOAD_BANNER_HREF);
  };

  const navClassName = `${styles.mainNav} ${menuOpen ? styles.open : ""}`;

  const renderNavBody = () => (
    <>
      {/* Mobile header */}

      <div className={styles.mobileMenuHeader}>
        <span>منوی دات‌وان تریپ</span>

        <button
          type="button"
          className={styles.mobileClose}
          onClick={() => setMenuOpen(false)}
          aria-label="بستن منو"
        >
          <X size={20} />
        </button>
      </div>

      {/* Links */}

      <div className={styles.navLinks}>
        {navItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;

          const active = isActive(item.href);

          const submenuIsOpen = openSubmenu === item.label;

          return (
            <div
              className={`${styles.navItem} ${
                hasChildren ? styles.hasChildren : ""
              }`}
              key={item.label}
            >
              {/* ============================
                      Normal Link
                  ============================ */}

              {!hasChildren && (
                <Link
                  href={item.href}
                  className={active ? styles.activeLink : ""}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              )}

              {/* ============================
                      Link with submenu
                  ============================ */}

              {hasChildren && (
                <>
                  <div
                    className={`${styles.parentLink} ${
                      active ? styles.activeLink : ""
                    }`}
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        /*
                              روی دسکتاپ لینک اصلی کار می‌کند.
                              روی موبایل فلش جداگانه
                              زیرمنو را باز می‌کند.
                            */
                        setMenuOpen(false);
                      }}
                    >
                      {item.label}
                    </Link>

                    {/* Desktop arrow */}

                    <ChevronDown
                      size={15}
                      strokeWidth={1.8}
                      className={styles.desktopChevron}
                      aria-hidden="true"
                    />

                    {/* Mobile submenu button */}

                    <button
                      type="button"
                      className={styles.mobileSubmenuButton}
                      onClick={() => toggleSubmenu(item.label)}
                      aria-label={`نمایش زیرمنوی ${item.label}`}
                      aria-expanded={submenuIsOpen}
                    >
                      <ChevronLeft size={17} strokeWidth={1.8} />
                    </button>
                  </div>

                  {/* Submenu */}

                  <div
                    className={`${styles.submenu} ${
                      submenuIsOpen ? styles.submenuOpen : ""
                    }`}
                  >
                    {item.children?.map((child) => (
                      <Link
                        href={child.href}
                        key={`${child.label}-${child.href}`}
                        onClick={() => {
                          setMenuOpen(false);
                          setOpenSubmenu(null);
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile actions */}

      <div className={styles.mobileActions}>
        <Link
          href="https://apply.dotone.ir/"
          className={styles.mobilePrimary}
          onClick={() => setMenuOpen(false)}
        >
          همکاری با تریپ
          <Image src={ShakeHand} alt="" width={18} height={18} />
        </Link>
        <Link
          href={DOWNLOAD_BANNER_HREF}
          className={styles.mobileSecondary}
          onClick={goToDownloadBanner}
        >
          <Download size={17} />
          دانلود اپلیکیشن
        </Link>
      </div>
    </>
  );

  return (
    <>
      <header
        className={`${styles.navShell} ${
          isLightVariant ? styles.navLight : styles.navDark
        } ${pathname !== "/" ? styles.pageFrame : ""}`}
      >
        {/* Logo */}

        <Link href="/" aria-label="دات‌وان تریپ" className={styles.brand}>
          <PublicImage
            src={isLightVariant ? media.logoFooter : media.logo}
            alt="دات‌وان تریپ"
            width={140}
            height={50}
            priority
          />
        </Link>

        {/* Desktop navigation stays in the header row */}

        <nav
          className={`${navClassName} ${styles.desktopNav}`}
          aria-label="منوی اصلی"
        >
          {renderNavBody()}
        </nav>

        {/* Desktop Actions */}

        <div className={styles.navActions}>
          <Link href="https://apply.dotone.ir/" className="button button-brand">
            همکاری با تریپ
            <Image src={ShakeHand} alt="" width={18} height={18} />
          </Link>

          <Link
            href={DOWNLOAD_BANNER_HREF}
            className={`button ${
              isLightVariant ? "button-dark" : "button-glass"
            }`}
            onClick={goToDownloadBanner}
          >
            <Download size={18} />
            دانلود اپلیکیشن
          </Link>
        </div>

        {/* Mobile menu trigger */}

        <button
          type="button"
          className={styles.menuButton}
          aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {portalReady &&
        createPortal(
          <>
            <nav
              className={`${navClassName} ${styles.mobileNav} ${styles.navLight}`}
              aria-label="منوی اصلی"
            >
              {renderNavBody()}
            </nav>
            {menuOpen && (
              <button
                type="button"
                className={styles.backdrop}
                aria-label="بستن منو"
                onClick={() => {
                  setMenuOpen(false);
                  setOpenSubmenu(null);
                }}
              />
            )}
          </>,
          document.body,
        )}
    </>
  );
}
