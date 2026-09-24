"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  formatJalali,
  isoToJalali,
  jalaliMonthLength,
  jalaliMonthName,
  jalaliToIso,
  jalaliWeekdayOffset,
  jalaliWeekdays,
  parseJalaliText,
  todayJalali,
  toPersianDigits,
  type JalaliDate,
} from "@/lib/calendar/jalali";
import styles from "./Admin.module.css";

type ShamsiDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  mode: "text" | "iso";
};

function readJalali(value: string, mode: ShamsiDateFieldProps["mode"]) {
  return mode === "iso" ? isoToJalali(value) : parseJalaliText(value);
}

export default function ShamsiDateField({ value, onChange, disabled, mode }: ShamsiDateFieldProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = readJalali(value, mode);
  const [cursor, setCursor] = useState<JalaliDate>(selected ?? todayJalali());

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function choose(day: number) {
    const next = { jy: cursor.jy, jm: cursor.jm, jd: day };
    onChange(mode === "iso" ? jalaliToIso(next) : formatJalali(next));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setCursor((current) => {
      let jm = current.jm + delta;
      let jy = current.jy;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      }
      if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      return { jy, jm, jd: 1 };
    });
  }

  const days = jalaliMonthLength(cursor.jy, cursor.jm);
  const offset = jalaliWeekdayOffset({ jy: cursor.jy, jm: cursor.jm, jd: 1 });
  const display = mode === "iso" ? (selected ? formatJalali(selected) : "") : value;

  return (
    <div className={styles.dateField} ref={rootRef}>
      <input
        value={display}
        disabled={disabled}
        placeholder={mode === "iso" ? "انتخاب تاریخ" : "۱ شهریور ۱۴۰۵"}
        onChange={(event) => {
          if (mode === "text") onChange(event.target.value);
        }}
        readOnly={mode === "iso"}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
      />
      <button
        className={styles.calendarToggle}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (selected) setCursor(selected);
          setOpen((current) => !current);
        }}
      >
        تقویم
      </button>
      {open ? (
        <div className={styles.calendar} id={panelId} role="dialog" aria-label="تقویم شمسی">
          <div className={styles.calendarHead}>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="ماه بعد">
              ‹
            </button>
            <strong>
              {jalaliMonthName(cursor.jm)} {toPersianDigits(cursor.jy)}
            </strong>
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="ماه قبل">
              ›
            </button>
          </div>
          <div className={styles.calendarWeek}>
            {jalaliWeekdays().map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className={styles.calendarGrid}>
            {Array.from({ length: offset }, (_, index) => (
              <span key={`pad-${index}`} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1;
              const active = selected?.jy === cursor.jy && selected.jm === cursor.jm && selected.jd === day;
              return (
                <button key={day} type="button" aria-pressed={active} onClick={() => choose(day)}>
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>
          {value ? (
            <button
              className={styles.calendarClear}
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              پاک کردن
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
