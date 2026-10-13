import { useCallback, useEffect, useRef, type RefObject } from "react";

const focusable =
  "a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable],audio[controls],video[controls]";

/** Keep every financial review modal and restore its opener on dismissal. */
export function useReviewDialog(
  ref: RefObject<HTMLDivElement | null>,
  open: boolean,
  busy: boolean,
  onClose: () => void,
) {
  const current = useRef({ busy, onClose });
  const savedOpener = useRef<HTMLElement | null>(null);
  current.current = { busy, onClose };
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const opener = savedOpener.current ?? (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : undefined);
    const background: { element: HTMLElement; inert: boolean }[] = [];
    // Reviews can be nested in deployment or recovery panels. Isolate siblings
    // at each ancestor so the entire background, including navigation, is inert.
    let foreground: Element = dialog;
    while (foreground.parentElement) {
      const parent = foreground.parentElement;
      for (const sibling of parent.children) {
        if (sibling !== foreground && sibling instanceof HTMLElement) {
          background.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      if (parent === document.body) break;
      foreground = parent;
    }
    dialog.focus();
    const containFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Node) || !dialog.contains(event.target))
        dialog.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!current.current.busy) current.current.onClose();
      }
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(focusable))
        .filter((node) => node.tabIndex >= 0 && !node.matches(":disabled") &&
          !node.closest("[inert]") && node.getClientRects().length > 0 &&
          getComputedStyle(node).visibility !== "hidden");
      if (!controls.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const active = document.activeElement;
      const first = controls[0], last = controls[controls.length - 1];
      if (!controls.some((node) => node === active) ||
        (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", containFocus);
      for (const { element, inert } of background) element.inert = inert;
      savedOpener.current = null;
      if (opener?.isConnected) opener.focus();
    };
  }, [open, ref]);
  // Simulation disables the review trigger and can blur it before the modal
  // opens. Call this before awaiting any review preparation to retain it.
  return useCallback((opener?: HTMLElement) => {
    if (opener) savedOpener.current = opener;
    else if (document.activeElement instanceof HTMLElement)
      savedOpener.current = document.activeElement;
  }, []);
}
