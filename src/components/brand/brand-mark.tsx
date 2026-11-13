import {
  siApple,
  siHp,
  siDell,
  siLenovo,
  siAsus,
  siGooglechrome,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";

const brandIcons: Record<string, SimpleIcon> = {
  Apple: siApple,
  HP: siHp,
  Dell: siDell,
  Lenovo: siLenovo,
  ASUS: siAsus,
  Chromebook: siGooglechrome,
  "Google Chrome": siGooglechrome,
};

type BrandMarkProps = {
  name: string;
  size?: number;
  monochrome?: boolean;
};

export function BrandMark({ name, size = 34, monochrome = false }: BrandMarkProps) {
  const icon = brandIcons[name];

  if (!icon) {
    return <span className="brand-wordmark-fallback">{name}</span>;
  }

  return (
    <svg
      aria-label={`${name} brand mark`}
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="brand-mark-svg"
      style={{ color: monochrome ? "currentColor" : `#${icon.hex}` }}
    >
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}
