"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, "") || "/";
}

export function scrollToHashId(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

type HashScrollLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

export default function HashScrollLink({
  href,
  className,
  children,
  onClick,
}: HashScrollLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const url = new URL(href, window.location.href);
    const samePage =
      Boolean(url.hash) &&
      normalizePath(url.pathname) === normalizePath(window.location.pathname);

    if (samePage) {
      event.preventDefault();
      scrollToHashId(url.hash);
    }

    onClick?.();
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
