import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ToolbarIcon, type ToolbarIconId } from './icons/ToolbarIcons';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ToolbarIconId;
  label: string;
  variant?: 'default' | 'primary' | 'done';
  showLabel?: boolean;
  children?: ReactNode;
};

export function IconButton({
  icon,
  label,
  variant = 'default',
  showLabel = false,
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'icon-btn-primary'
      : variant === 'done'
        ? 'icon-btn-done'
        : '';

  return (
    <button
      type="button"
      className={`icon-btn ${variantClass} ${className}`.trim()}
      title={label}
      aria-label={label}
      {...rest}
    >
      <ToolbarIcon name={icon} className="icon-btn-svg" />
      {showLabel && <span className="icon-btn-label">{label}</span>}
      {children}
    </button>
  );
}
