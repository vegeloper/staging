export type MediaKind = "image" | "video";

export type MediaListItem = {
  id: string;
  kind: MediaKind;
  originalName: string;
  description: string;
  altText: string;
  mimeType: string;
  extension: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  sha256: string;
  thumbUrl: string | null;
  scanEngine: string;
  scanResult: string;
  uploaderName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaRecord = MediaListItem & {
  ownerId: string | null;
};
