/**
 * Accessibility skip link for keyboard users to bypass navigation.
 */

import { memo, useCallback } from 'react';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export const SkipLink = memo(function SkipLink({
  targetId,
  label = 'Skip to main content',
}: SkipLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [targetId]
  );

  return (
    <a href={`#${targetId}`} className="skip-link" onClick={handleClick}>
      {label}
    </a>
  );
});
