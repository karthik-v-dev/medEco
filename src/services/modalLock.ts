import { useEffect } from 'react';

let activeModalsCounter = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyOverscroll = '';
let originalHtmlOverscroll = '';

// Prevent touch scroll propagation on mobile when a modal is open
const preventBackgroundTouchMove = (e: TouchEvent) => {
  const target = e.target as HTMLElement | null;
  // Allow scrolling only if the touch is originating inside an element marked with overflow-y-auto, overflow-auto, or data-modal-scrollable
  if (!target || !target.closest('.overflow-y-auto, .overflow-auto, [data-modal-scrollable="true"]')) {
    if (e.cancelable) {
      e.preventDefault();
    }
  }
};

export const lockBackgroundScroll = () => {
  if (typeof document === 'undefined') return;
  if (activeModalsCounter === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverscroll = document.body.style.overscrollBehavior;
    originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    // Freeze both body and html on mobile and desktop
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';
    document.documentElement.style.overscrollBehavior = 'contain';

    // Prevent elastic rubberband / background drag on mobile touch devices
    document.addEventListener('touchmove', preventBackgroundTouchMove, { passive: false });
  }
  activeModalsCounter++;
};

export const unlockBackgroundScroll = () => {
  if (typeof document === 'undefined') return;
  activeModalsCounter = Math.max(0, activeModalsCounter - 1);
  if (activeModalsCounter === 0) {
    document.body.style.overflow = originalBodyOverflow || '';
    document.documentElement.style.overflow = originalHtmlOverflow || '';
    document.body.style.overscrollBehavior = originalBodyOverscroll || '';
    document.documentElement.style.overscrollBehavior = originalHtmlOverscroll || '';

    document.removeEventListener('touchmove', preventBackgroundTouchMove);
  }
};

/**
 * React hook that restricts background scrolling whenever a popup/modal/chatbot is open.
 * Restores original scrollability only after the popup or chatbot closes.
 */
export const useModalScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    lockBackgroundScroll();

    return () => {
      unlockBackgroundScroll();
    };
  }, [isOpen]);
};

