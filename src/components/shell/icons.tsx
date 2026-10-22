// Line icons of the shell, drawn from the design/ mockups (24 × 24, stroke = currentColor).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, strokeWidth = 2, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconMenu = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);

export const IconList = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.2" />
    <circle cx="4.5" cy="12" r="1.2" />
    <circle cx="4.5" cy="18" r="1.2" />
  </Icon>
);

export const IconRecipes = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5c0-1.1.9-2 2-2h13v14H6c-1.1 0-2 .9-2 2V5z" />
    <path d="M4 19c0 1.1.9 2 2 2h13v-4" />
  </Icon>
);

export const IconCart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 4h3l2.5 11h11l2-8H6.5" />
    <circle cx="9" cy="19.5" r="1.5" />
    <circle cx="17" cy="19.5" r="1.5" />
  </Icon>
);

export const IconHouse = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M4 11l8-6.5 8 6.5" />
    <path d="M6 9.5V19h12V9.5" />
    <path d="M10 19v-5h4v5" />
  </Icon>
);

export const IconAisles = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M3.5 5l1 1-1 1M3.5 11l1 1-1 1M3.5 17l1 1-1 1" />
  </Icon>
);

export const IconSignOut = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 16l-4-4 4-4M6 12h10" />
  </Icon>
);

export const IconSettings = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icon>
);

export const IconChevronDown = (p: IconProps) => (
  <Icon size={14} strokeWidth={2.6} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const IconChevronRight = (p: IconProps) => (
  <Icon size={16} strokeWidth={2.4} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);

export const IconClose = (p: IconProps) => (
  <Icon size={18} strokeWidth={2.4} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
