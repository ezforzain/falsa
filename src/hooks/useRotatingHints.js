import { useEffect, useState } from 'react';

// Cycles through `hints` one at a time every `intervalMs`, holding on the current hint
// whenever `paused` is true instead of advancing. Resuming always starts a fresh full-length
// interval (rather than continuing a partially-elapsed one), so the visible hint always gets
// its full dwell time once you stop typing/unfocus.
export default function useRotatingHints(hints, intervalMs, paused) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (paused || hints.length === 0) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % hints.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [paused, hints, intervalMs]);

  return hints[index] ?? '';
}
