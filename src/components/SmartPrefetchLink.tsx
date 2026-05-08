'use client';

import { useCallback, type MouseEventHandler, type FocusEventHandler, type TouchEventHandler } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SmartPrefetchLinkProps = React.ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
};

export default function SmartPrefetchLink({
  href,
  onMouseEnter,
  onFocus,
  onTouchStart,
  prefetchOnHover = true,
  prefetch = false,
  ...props
}: SmartPrefetchLinkProps) {
  const router = useRouter();
  const hrefString = typeof href === 'string' ? href : href.toString();

  const triggerPrefetch = useCallback(() => {
    if (!prefetchOnHover) {
      return;
    }

    router.prefetch(hrefString);
  }, [hrefString, prefetchOnHover, router]);

  const handleMouseEnter: MouseEventHandler<HTMLAnchorElement> = (event) => {
    triggerPrefetch();
    onMouseEnter?.(event);
  };

  const handleFocus: FocusEventHandler<HTMLAnchorElement> = (event) => {
    triggerPrefetch();
    onFocus?.(event);
  };

  const handleTouchStart: TouchEventHandler<HTMLAnchorElement> = (event) => {
    triggerPrefetch();
    onTouchStart?.(event);
  };

  return <Link href={href} prefetch={prefetch} onMouseEnter={handleMouseEnter} onFocus={handleFocus} onTouchStart={handleTouchStart} {...props} />;
}
