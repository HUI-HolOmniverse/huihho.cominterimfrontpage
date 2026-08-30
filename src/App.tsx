import { useCallback, useEffect, useState } from "react";
import { Header, Ticker, Footer } from "./chrome";
import { Opening, Doors, Fabric, Beholder } from "./sectionsA";
import { CanonicalMap, Crowd, Topology, Publishing } from "./sectionsB";
import { Constellation } from "./sectionsC";
import { Launcher } from "./Launcher";

export default function App() {
  const [launcherOpen, setLauncherOpen] = useState(false);

  const openLauncher = useCallback(() => setLauncherOpen(true), []);
  const closeLauncher = useCallback(() => setLauncherOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setLauncherOpen((v) => !v);
      } else if (e.key === "Escape") {
        setLauncherOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body selection:bg-lumen-500/30">
      <div className="noise-overlay" aria-hidden="true" />

      <Header onLaunch={openLauncher} />

      <main>
        <Opening />
        <Doors />
        <Fabric onLaunch={openLauncher} />
        <Beholder />
        <CanonicalMap />
        <Crowd />
        <Topology />
        <Publishing />
        <Ticker />
        <Constellation />
      </main>

      <Footer onLaunch={openLauncher} />

      <Launcher open={launcherOpen} onClose={closeLauncher} />
    </div>
  );
}
