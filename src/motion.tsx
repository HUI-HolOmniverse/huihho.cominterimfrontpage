import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

/* ---------- prefers-reduced-motion ---------- */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ---------- in-view observer ---------- */
export function useInView<T extends HTMLElement>(
  threshold = 0.18,
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ---------- Reveal wrapper ---------- */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "figure" | "blockquote";
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const style: CSSProperties = { transitionDelay: `${delay}ms` };
  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      className={`${className} ${inView ? "is-in" : ""}`}
      style={style}
    >
      {children}
    </Tag>
  );
}

/* ---------- line-mask heading reveal ---------- */
export function Lines({
  lines,
  className = "",
  stagger = 110,
}: {
  lines: ReactNode[];
  className?: string;
  stagger?: number;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  return (
    <span ref={ref} className={`${className} ${inView ? "is-in" : ""}`}>
      {lines.map((l, i) => (
        <span className="line-mask" key={i}>
          <span style={{ transitionDelay: `${i * stagger}ms` }}>{l}</span>
        </span>
      ))}
    </span>
  );
}

/* ---------- scramble-decode ---------- */
const GLYPHS = "∞◇·/\\<>+*≠HUIO";

export function Scramble({
  text,
  className = "",
  speed = 26,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLSpanElement>(0.4);
  const [out, setOut] = useState(reduced ? text : "");
  const done = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const run = useCallback(() => {
    if (done.current) return;
    done.current = true;
    if (reduced) {
      setOut(text);
      return;
    }
    let frame = 0;
    const total = text.length;
    const id = window.setInterval(() => {
      frame += 1;
      const locked = Math.floor((frame / 2.2) * 1.4);
      let s = "";
      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (ch === " " || ch === "·") s += ch;
        else if (i < locked) s += ch;
        else s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOut(s);
      if (locked >= total) {
        setOut(text);
        window.clearInterval(id);
        intervalRef.current = null;
      }
    }, speed);
    intervalRef.current = id;
  }, [reduced, text, speed]);

  useEffect(() => {
    if (inView) run();
  }, [inView, run]);

  /* nunca vaza timer após desmontagem */
  useEffect(
    () => () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    },
    [],
  );

  useEffect(() => {
    if (reduced) setOut(text);
  }, [reduced, text]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {out || "\u00A0"}
    </span>
  );
}

/* ---------- smooth anchor ---------- */
export function useAnchorNav() {
  return useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, []);
}
