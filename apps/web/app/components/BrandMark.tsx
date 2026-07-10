import type { SVGProps } from 'react';

type BrandMarkProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

export default function BrandMark({ className = '', ...props }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M366 190 405 238C319 308 267 404 267 506s52 198 138 269l-39 48C263 738 205 629 205 506s58-232 161-316Z" />
      <path d="M592 296c114 0 206 93 206 207s-92 207-206 207c-32 0-63-7-93-22l-76 27c-9 3-17-5-15-15l18-75c-26-35-41-77-41-122 0-114 93-207 207-207Z" />
    </svg>
  );
}
