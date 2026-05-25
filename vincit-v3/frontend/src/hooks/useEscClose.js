import { useEffect } from 'react';

// Tiny hook: registers a global keydown listener for the lifetime of
// the component and calls `onClose` whenever the user presses Escape.
// Used by every modal so desktop users can dismiss them with the
// keyboard instead of hunting for the × button.
//
// Skips when:
//   - no `onClose` was supplied (read-only / always-open modals)
//   - `active` is explicitly false (lets the caller gate dynamically)
//
// Doesn't preventDefault or stopPropagation: that lets nested
// overlays (e.g. a popover inside a modal) each handle their own
// ESC; only the most recently mounted listener fires per dispatch.
export default function useEscClose(onClose, active = true) {
  useEffect(() => {
    if (!active || typeof onClose !== 'function') return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, active]);
}
