import { useCallback, useEffect, useState } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { Header, Ticker, Footer } from "./chrome";
import { Opening, Doors, Fabric, Beholder } from "./sectionsA";
import { CanonicalMap, Crowd, Topology, Publishing } from "./sectionsB";
import { Constellation } from "./sectionsC";
import { Launcher } from "./Launcher";
import IcebergAtlas from "./IcebergAtlas";

function Portal() {
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/iceberg" element={<IcebergAtlas />} />
        <Route path="*" element={<Portal />} />
      </Routes>
    </HashRouter>
  );
}
