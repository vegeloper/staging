import { isLibraryFilePath } from "@/lib/media/paths";

export const contentImages = [
  { src: "/figma/png/passenger-insideCar.jpg", label: "مسافر داخل خودرو" },
  { src: "/figma/png/cars-insideCabin.png", label: "کابین خودرو" },
  { src: "/figma/png/mobilephone.png", label: "موبایل" },
  { src: "/figma/png/driver-backneck.png", label: "راننده" },
  { src: "/figma/png/cars-navy.jpg", label: "ناوگان" },
  { src: "/figma/png/callCenter.png", label: "پشتیبانی" },
  { src: "/figma/png/information.png", label: "اطلاعیه" },
  { src: "/figma/png/image1.png", label: "تصویر ۱" },
  { src: "/figma/png/image2.png", label: "تصویر ۲" },
  { src: "/figma/png/image3.png", label: "تصویر ۳" },
] as const;

export const contentImageSrcs: readonly string[] = contentImages.map((image) => image.src);

export function isAllowedContentImage(src: string) {
  return contentImageSrcs.includes(src) || isLibraryFilePath(src);
}
