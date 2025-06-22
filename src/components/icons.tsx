import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      {...props}
    >
      <path d="M4 4h4v4H4z" />
      <path d="M10 4h4v4h-4z" />
      <path d="M16 4h4v4h-4z" />
      <path d="M10 10h4v4h-4z" />
      <path d="M10 16h4v4h-4z" />
    </svg>
  ),
};
