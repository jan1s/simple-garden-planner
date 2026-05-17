import {
  LEGAL_DISCLAIMER_FULL,
  LEGAL_DISCLAIMER_SHORT,
} from '../legal/disclaimer';

type LegalDisclaimerProps = {
  variant?: 'compact' | 'full';
  className?: string;
};

export function LegalDisclaimer({
  variant = 'full',
  className = '',
}: LegalDisclaimerProps) {
  const text =
    variant === 'compact' ? LEGAL_DISCLAIMER_SHORT : LEGAL_DISCLAIMER_FULL;

  return (
    <p
      className={`legal-disclaimer legal-disclaimer-${variant} ${className}`.trim()}
      role="note"
    >
      {text}
    </p>
  );
}
