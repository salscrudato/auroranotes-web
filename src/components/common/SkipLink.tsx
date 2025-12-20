/**
 * SkipLink component
 * Allows keyboard users to skip to main content
 */

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export function SkipLink({ targetId, label = 'Skip to main content' }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a 
      href={`#${targetId}`}
      className="skip-link"
      onClick={handleClick}
    >
      {label}
    </a>
  );
}

