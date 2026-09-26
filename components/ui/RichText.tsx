import type { ReactNode } from "react";

import { parseInline } from "@/lib/cms/inline";

import styles from "./RichText.module.css";

export default function RichText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, index) => {
        let node: ReactNode = part.text;
        if (part.bold) node = <strong>{node}</strong>;
        if (part.underline) node = <span className={styles.underline}>{node}</span>;
        if (part.href) {
          const external = /^https?:/i.test(part.href);
          node = (
            <a
              className={styles.link}
              href={part.href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {node}
            </a>
          );
        }
        return <span key={index}>{node}</span>;
      })}
    </>
  );
}
