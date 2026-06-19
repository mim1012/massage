'use client';

import { useCallback, type MouseEventHandler, type FocusEventHandler, type TouchEventHandler } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SmartPrefetchLinkProps = React.ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
};

export default function SmartPrefetchLink({
  href,
  onClick,
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

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);

    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const targetUrl = new URL(hrefString, window.location.origin);
    if (window.location.pathname !== '/' || targetUrl.origin !== window.location.origin || targetUrl.pathname !== '/') {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('public-directory:navigate', {
        detail: { href: `${targetUrl.pathname}${targetUrl.search}` },
      }),
    );
    event.preventDefault();
  };

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

  return <Link href={href} prefetch={prefetch} onClick={handleClick} onMouseEnter={handleMouseEnter} onFocus={handleFocus} onTouchStart={handleTouchStart} {...props} />;
}
