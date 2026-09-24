"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import styles from "./Admin.module.css";

type RemovableKind = "media" | "content" | "position" | "submission";

type Selection = {
  selected: ReadonlySet<string>;
  toggle: (id: string) => void;
};

const SelectionContext = createContext<Selection | null>(null);

async function deleteRecords(kind: RemovableKind, ids: string[]) {
  const response = await fetch("/api/admin/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, ids }),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; deleted?: number };
  if (!response.ok) throw new Error(data.error || "حذف ناموفق بود.");
  return data.deleted ?? 0;
}

export function DeleteSelection({
  kind,
  ids,
  children,
}: {
  kind: RemovableKind;
  ids: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setArmed(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function remove(target: string[]) {
    setPending(true);
    setError("");
    try {
      await deleteRecords(kind, target);
      setSelected(new Set());
      setArmed(false);
      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "حذف ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  return (
    <SelectionContext.Provider value={{ selected, toggle }}>
      <div className={styles.deleteBar}>
        <button className="button button-dark" type="button" disabled={pending || ids.length === 0} onClick={() => {
          setArmed(false);
          setSelected(allSelected ? new Set() : new Set(ids));
        }}>
          {allSelected ? "لغو انتخاب صفحه" : "انتخاب همه این صفحه"}
        </button>
        <button
          className="button button-dark"
          type="button"
          disabled={pending || selected.size === 0}
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            void remove([...selected]);
          }}
        >
          {armed ? "تأیید حذف گروهی" : `حذف گروهی (${selected.size.toLocaleString("fa-IR")})`}
        </button>
        {error ? <span className={styles.warning}>{error}</span> : null}
      </div>
      {children}
    </SelectionContext.Provider>
  );
}

export function DeleteCheckbox({ id }: { id: string }) {
  const selection = useContext(SelectionContext);
  if (!selection) return null;
  return (
    <input
      type="checkbox"
      checked={selection.selected.has(id)}
      aria-label="انتخاب برای حذف"
      onChange={() => selection.toggle(id)}
    />
  );
}

export function DeleteOne({ kind, id }: { kind: RemovableKind; id: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <button
      className={styles.deleteOne}
      type="button"
      disabled={pending}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setPending(true);
        void deleteRecords(kind, [id])
          .then(() => router.refresh())
          .catch(() => setPending(false))
          .finally(() => setArmed(false));
      }}
    >
      {armed ? "تأیید" : "حذف"}
    </button>
  );
}
