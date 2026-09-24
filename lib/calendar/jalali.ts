const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function div(a: number, b: number) {
  return ~~(a / b);
}

function mod(a: number, b: number) {
  return a - ~~(a / b) * b;
}

function g2d(gy: number, gm: number, gd: number) {
  let day =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  day = day - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return day;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) {
    throw new Error(`Invalid Jalaali year ${jy}`);
  }
  for (let index = 1; index < breaks.length; index += 1) {
    const jm = breaks[index];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function j2d(jy: number, jm: number, jd: number) {
  const year = jalCal(jy);
  return g2d(year.gy, 3, year.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const year = jalCal(jy);
  const jdn1f = g2d(gy, 3, year.march);
  let day = jdn - jdn1f;
  if (day >= 0) {
    if (day <= 185) return { jy, jm: 1 + div(day, 31), jd: mod(day, 31) + 1 };
    day -= 186;
  } else {
    jy -= 1;
    day += 179;
    if (year.leap === 1) day += 1;
  }
  return { jy, jm: 7 + div(day, 30), jd: mod(day, 30) + 1 };
}

export type JalaliDate = { jy: number; jm: number; jd: number };

export function toPersianDigits(value: number | string) {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function fromPersianDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

export function jalaliToGregorian(jy: number, jm: number, jd: number) {
  return d2g(j2d(jy, jm, jd));
}

export function isJalaliLeapYear(jy: number) {
  return jalCal(jy).leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function jalaliMonthName(jm: number) {
  return MONTHS[jm - 1] ?? "";
}

export function jalaliWeekdays() {
  return WEEKDAYS;
}

export function formatJalali(date: JalaliDate) {
  return `${toPersianDigits(date.jd)} ${jalaliMonthName(date.jm)} ${toPersianDigits(date.jy)}`;
}

export function parseJalaliText(value: string): JalaliDate | null {
  try {
    const match = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(fromPersianDigits(value).trim());
    if (!match) return null;
    const jd = Number(match[1]);
    const jm = MONTHS.indexOf(match[2] as (typeof MONTHS)[number]) + 1;
    const jy = Number(match[3]);
    if (!jm || jd < 1 || jd > jalaliMonthLength(jy, jm)) return null;
    return { jy, jm, jd };
  } catch {
    return null;
  }
}

export function jalaliToIso(date: JalaliDate) {
  const gregorian = jalaliToGregorian(date.jy, date.jm, date.jd);
  const month = String(gregorian.gm).padStart(2, "0");
  const day = String(gregorian.gd).padStart(2, "0");
  return `${gregorian.gy}-${month}-${day}`;
}

export function isoToJalali(value: string): JalaliDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return gregorianToJalali(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function todayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function jalaliWeekdayOffset(date: JalaliDate) {
  const gregorian = jalaliToGregorian(date.jy, date.jm, date.jd);
  const jsDay = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).getDay();
  return (jsDay + 1) % 7;
}
