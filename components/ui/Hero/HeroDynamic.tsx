import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import HashScrollLink from "@/components/ui/HashScrollLink";
import heroImage from "@/public/figma/svgs/service-city.svg";
import styles from "./Hero.module.css";

type HeroIcon = LucideIcon | StaticImageData;

type HeroButton = {
  text: string;
  icon?: HeroIcon;
  variant: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
};

type HeroProps = {
  badge?: {
    text: string;
    icon?: StaticImageData;
  };

  title: {
    highlight?: string;
    text: string;
  };

  description?: string;

  buttons?: HeroButton[];

  image: {
    src: StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
};

function renderIcon(icon: HeroIcon, size = 18) {
  // Static imported image
  if (typeof icon === "object") {
    return (
      <Image
        src={icon}
        alt=""
        width={size}
        height={size}
        aria-hidden="true"
      />
    );
  }

  // Lucide icon
  const Icon = icon;

  return <Icon size={size} aria-hidden="true" />;
}

export default function Hero({
  badge,
  title,
  description,
  buttons = [],
  image,
}: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        {badge && (
          <span className={styles.badge}>
            {badge.icon && renderIcon(badge.icon, 7)}
            {badge.text}
          </span>
        )}

        <h1>
          {title.highlight && (
            <span>{title.highlight}</span>
          )}

          {title.highlight && ""}

          {title.text}
        </h1>

        {description && (
          <p>{description}</p>
        )}

        {buttons.length > 0 && (
          <div className={styles.buttons}>
            {buttons.map((button, index) => {
              const className =
                button.variant === "primary"
                  ? styles.primaryButton
                  : styles.secondaryButton;
              const content = (
                <>
                  {button.icon && renderIcon(button.icon, 18)}
                  {button.text}
                </>
              );

              if (button.href) {
                const LinkComponent = button.href.includes("#")
                  ? HashScrollLink
                  : Link;
                return (
                  <LinkComponent
                    key={`${button.text}-${index}`}
                    href={button.href}
                    className={className}
                    onClick={button.onClick}
                  >
                    {content}
                  </LinkComponent>
                );
              }

              return (
                <button
                  key={`${button.text}-${index}`}
                  type="button"
                  className={className}
                  onClick={button.onClick}
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.visual}>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          priority
        />
      </div>
    </section>
  );
}