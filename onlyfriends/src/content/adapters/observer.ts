/**
 * Debounced MutationObserver that ignores OnlyFriends UI mutations.
 */

export interface ObserverOptions {
  debounceMs?: number;
  root?: Node;
  onMutate: () => void;
}

export function createDebouncedObserver(options: ObserverOptions): {
  start: () => void;
  stop: () => void;
  flush: () => void;
} {
  const debounceMs = options.debounceMs ?? 120;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let observer: MutationObserver | null = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    options.onMutate();
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      options.onMutate();
    }, debounceMs);
  };

  const start = () => {
    if (observer) return;
    const root = options.root ?? document.body;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        const t = m.target;
        if (t instanceof Element && t.closest("#onlyfriends-root")) {
          continue;
        }
        // If all added nodes are inside our root, skip
        let relevant = false;
        if (m.type === "childList") {
          const nodes = [...Array.from(m.addedNodes), ...Array.from(m.removedNodes)];
          for (const n of nodes) {
            if (n instanceof Element && n.closest("#onlyfriends-root")) continue;
            if (n instanceof Element && n.id === "onlyfriends-root") continue;
            relevant = true;
            break;
          }
        } else {
          relevant = true;
        }
        if (relevant) {
          schedule();
          return;
        }
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  };

  const stop = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    observer?.disconnect();
    observer = null;
  };

  return { start, stop, flush };
}
