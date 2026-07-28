import { useEffect, useState } from 'react';
import logoMark from '../assets/logo-mark.png';

// Branded splash/loading screen — shown at cold app load while AuthContext checks for an
// existing session (see App.jsx: `status === 'loading'`), and reused as-is anywhere else a
// full-screen loading moment is needed, so the same logo + animation + cream background is the
// one "loading state" the whole app ever shows. Fades itself out smoothly rather than just
// disappearing the instant `visible` flips false, so the handoff to real content never pops.
export default function SplashScreen({ visible }) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), 280);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-cream transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden={!visible}
    >
      <img
        src={logoMark}
        alt="FalsafahTot"
        className="animate-splash-logo w-24 h-24 sm:w-28 sm:h-28"
        width={112}
        height={112}
      />
    </div>
  );
}
