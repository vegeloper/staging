"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ChevronDown,
  ChevronLeft,
  Download,
  Menu,
  X,
} from "lucide-react";

import logo from "@/public/figma/logo.png";
import logoDark from "@/public/figma/logo-footer.png";
import ShakeHand from "@/public/figma/agreement.png";

import styles from "./Header.module.css";

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
        label: "سفر شهری",
        href: "/services",
      },
      {
        label: "سفر بین‌شهری",
        href: "/services",
      },
      {
        label: "خدمات سازمانی",
        href: "/services",
      },
      {
        label: "سرویس ویژه",
        href: "/services",
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
    label: "بلاگ",
    href: "/blog",
  },

  {
    label: "درباره تریپ",
    href: "/about",
    children: [
      {
        label: "درباره دات‌وان تریپ",
        href: "/about",
      },

      // {
      //   label: "همکاری با رانندگان",
      //   href: "/join-us/drivers",
      // },
      {
        label: "همکاری با تریپ",
        href: "/join-us/organizational",
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

export default function Header({
  variant = "light",
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<
    string | null
  >(null);

  const pathname = usePathname();

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
    setOpenSubmenu((current) =>
      current === label ? null : label,
    );
  };

  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const navClassName = `${styles.mainNav} ${
    menuOpen ? styles.open : ""
  }`;

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
              const hasChildren =
                item.children &&
                item.children.length > 0;

              const active = isActive(item.href);

              const submenuIsOpen =
                openSubmenu === item.label;

              return (
                <div
                  className={`${styles.navItem} ${
                    hasChildren
                      ? styles.hasChildren
                      : ""
                  }`}
                  key={item.label}
                >
                  {/* ============================
                      Normal Link
                  ============================ */}

                  {!hasChildren && (
                    <Link
                      href={item.href}
                      className={
                        active
                          ? styles.activeLink
                          : ""
                      }
                      onClick={() =>
                        setMenuOpen(false)
                      }
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
                          active
                            ? styles.activeLink
                            : ""
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
                          className={
                            styles.desktopChevron
                          }
                          aria-hidden="true"
                        />

                        {/* Mobile submenu button */}

                        <button
                          type="button"
                          className={
                            styles.mobileSubmenuButton
                          }
                          onClick={() =>
                            toggleSubmenu(item.label)
                          }
                          aria-label={`نمایش زیرمنوی ${item.label}`}
                          aria-expanded={
                            submenuIsOpen
                          }
                        >
                          <ChevronLeft
                            size={17}
                            strokeWidth={1.8}
                          />
                        </button>
                      </div>

                      {/* Submenu */}

                      <div
                        className={`${styles.submenu} ${
                          submenuIsOpen
                            ? styles.submenuOpen
                            : ""
                        }`}
                      >
                        {item.children?.map(
                          (child) => (
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
                          ),
                        )}
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
              href="/join-us/organizational"
              className={styles.mobilePrimary}
              onClick={() => setMenuOpen(false)}
            >
              همکاری با تریپ

              <Image
                src={ShakeHand}
                alt=""
                width={18}
                height={18}
              />
            </Link>

            <button
              type="button"
              className={styles.mobileSecondary}
            >
              <Download size={17} />
              دانلود اپلیکیشن
            </button>
          </div>
    </>
  );

  return (
    <>
      <header
        className={`${styles.navShell} ${
          isLightVariant
            ? styles.navLight
            : styles.navDark
        } ${pathname !== "/" ? styles.pageFrame : ""}`}
      >
        {/* Logo */}

        <Link
          href="/"
          aria-label="دات‌وان تریپ"
          className={styles.brand}
        >
          <Image
            src={isLightVariant ? logoDark : logo}
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
          <Link
            href="/join-us/organizational"
            className="button button-brand"
          >
            همکاری با تریپ

            <Image
              src={ShakeHand}
              alt=""
              width={18}
              height={18}
            />
          </Link>

          <button
            type="button"
            className={`button ${
              isLightVariant
                ? "button-dark"
                : "button-glass"
            }`}
          >
            <Download size={18} />
            دانلود اپلیکیشن
          </button>
        </div>

        {/* Mobile menu trigger */}

        <button
          type="button"
          className={styles.menuButton}
          aria-label={
            menuOpen ? "بستن منو" : "باز کردن منو"
          }
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpen((prev) => !prev)
          }
        >
          {menuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
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