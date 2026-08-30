import "@testing-library/jest-dom/vitest";

/* jsdom não implementa estes APIs — stubs determinísticos */
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  /* IntersectionObserver — jsdom não implementa; stub marca tudo como visível */
  if (!(globalThis as Record<string, unknown>).IntersectionObserver) {
    class IntersectionObserverStub {
      private cb: IntersectionObserverCallback;
      readonly root: Element | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: ReadonlyArray<number> = [];
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe(target: Element) {
        queueMicrotask(() =>
          this.cb(
            [{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          ),
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    (globalThis as Record<string, unknown>).IntersectionObserver = IntersectionObserverStub;
  }

  Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true, configurable: true });
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
