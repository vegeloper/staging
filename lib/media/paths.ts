const LIBRARY_FILE = /^\/media\/file\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function mediaFilePath(id: string) {
  return `/media/file/${id}`;
}

export function mediaThumbPath(id: string) {
  return `/media/thumb/${id}`;
}

export function libraryMediaId(src: string) {
  return src.match(LIBRARY_FILE)?.[1] ?? null;
}

export function isLibraryFilePath(src: string) {
  return libraryMediaId(src) !== null;
}
