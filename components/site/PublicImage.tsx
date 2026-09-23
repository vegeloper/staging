import Image from "next/image";

import { isLibraryFilePath } from "@/lib/media/paths";

type PublicImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export default function PublicImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: PublicImageProps) {
  if (src.endsWith(".svg") || isLibraryFilePath(src)) {
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
