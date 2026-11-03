import { ICONS } from './icons';

export interface IconProps { name: string; size?: number; className?: string }

export default function Icon({ name, size = 18, className = '' }: IconProps) {
  return (
    <svg
      className={`ic ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.circle }}
    />
  );
}
