"use client";

import { useEffect } from "react";

import { mediaFilePath } from "@/lib/media/paths";
import type { MediaKind } from "@/lib/media/types";
import styles from "./Admin.module.css";

type MediaViewerProps = {
  id: string;
  kind: MediaKind;
  name: string;
  onClose: () => void;
};

export default function MediaViewer({ id, kind, name, onClose }: MediaViewerProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const src = mediaFilePath(id);

  return (
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={name} onClick={onClose}>
      <button
        className={styles.viewerClose}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        بستن
      </button>
      {kind === "image" ? (
        <img src={src} alt={name} onClick={(event) => event.stopPropagation()} />
      ) : (
        <video src={src} controls autoPlay playsInline onClick={(event) => event.stopPropagation()} />
      )}
    </div>
  );
}
