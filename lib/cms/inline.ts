export type InlinePart = {
  text: string;
  bold?: boolean;
  underline?: boolean;
  href?: string;
};

type Flags = {
  bold?: boolean;
  underline?: boolean;
  href?: string;
};

const boldMark = /^\*\*([^*\n]+)\*\*/;
const underlineMark = /^\+\+([^+\n]+)\+\+/;
const linkMark = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;

export function safeHref(raw: string) {
  const value = raw.trim();
  if (!value || value.length > 500 || /\s/.test(value)) return null;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function plainText(value: string) {
  return value
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\+\+([^+\n]+)\+\+/g, "$1");
}

export function parseInline(source: string, inherited: Flags = {}): InlinePart[] {
  const parts: InlinePart[] = [];
  let index = 0;

  while (index < source.length) {
    const rest = source.slice(index);
    const bold = boldMark.exec(rest);
    const underline = underlineMark.exec(rest);
    const link = linkMark.exec(rest);

    if (bold) {
      parts.push(...parseInline(bold[1], { ...inherited, bold: true }));
      index += bold[0].length;
      continue;
    }
    if (underline) {
      parts.push(...parseInline(underline[1], { ...inherited, underline: true }));
      index += underline[0].length;
      continue;
    }
    if (link) {
      const href = safeHref(link[2]);
      parts.push(
        ...parseInline(link[1], href ? { ...inherited, href } : inherited),
      );
      index += link[0].length;
      continue;
    }

    const next = rest.slice(1).search(/[*+[]/);
    const length = next === -1 ? rest.length : next + 1;
    parts.push({ text: rest.slice(0, length), ...inherited });
    index += length;
  }

  return parts.filter((part) => part.text.length > 0);
}
