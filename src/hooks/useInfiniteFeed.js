import { useCallback, useEffect, useRef, useState } from 'react';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Turns a small, finite item list into a YouTube-style feed that never runs out: once the
// (reshuffled) list is exhausted it starts another lap rather than stopping, appending a batch
// at a time as the sentinel scrolls into view. Real pagination would replace `baseItems` with a
// paged API — this hook only owns the "keep it endless" mechanics, not the data source.
export default function useInfiniteFeed(baseItems, { batchSize = 6, keyField = 'id' } = {}) {
  const [items, setItems] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const lapRef = useRef(0);
  const pointerRef = useRef(0);
  const currentLapRef = useRef([]);

  const startNewLap = useCallback(() => {
    currentLapRef.current = shuffle(baseItems);
    pointerRef.current = 0;
    lapRef.current += 1;
  }, [baseItems]);

  const appendBatch = useCallback(() => {
    if (baseItems.length === 0) return;
    const appended = [];
    while (appended.length < batchSize) {
      if (pointerRef.current >= currentLapRef.current.length) startNewLap();
      const item = currentLapRef.current[pointerRef.current];
      appended.push({ ...item, feedKey: `${item[keyField]}__lap${lapRef.current}__${pointerRef.current}` });
      pointerRef.current += 1;
    }
    setItems((prev) => [...prev, ...appended]);
  }, [baseItems, batchSize, keyField, startNewLap]);

  // Reset and load the first batch whenever the underlying (filtered) item set changes —
  // e.g. a category or search query change swaps in a different pool to loop through.
  useEffect(() => {
    lapRef.current = 0;
    currentLapRef.current = [];
    pointerRef.current = 0;
    setItems([]);
    if (baseItems.length > 0) appendBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseItems]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || baseItems.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setLoadingMore(true);
        // Brief delay so the "loading" spinner is perceptible, like a real network round trip.
        const t = setTimeout(() => {
          appendBatch();
          setLoadingMore(false);
        }, 400);
        return () => clearTimeout(t);
      },
      { rootMargin: '600px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [appendBatch, baseItems.length]);

  return { items, loadingMore, sentinelRef };
}
