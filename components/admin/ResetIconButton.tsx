"use client";

import styles from "./Admin.module.css";

type ResetIconButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

export default function ResetIconButton({ label, disabled, onClick }: ResetIconButtonProps) {
  return (
    <button className={styles.resetIcon} type="button" disabled={disabled} aria-label={label} title={label} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M3 12a9 9 0 1 0 2.2-5.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M3 4v5h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
