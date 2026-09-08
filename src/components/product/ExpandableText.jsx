import { useLayoutEffect, useRef, useState } from 'react';

// YouTube-style description clamp — collapses long text to a fixed number of lines with a
// "See more" toggle, so a shopper can skim the description and get to the related-products rail
// below it without scrolling past a wall of text. The toggle only appears when the text actually
// overflows that many lines (measured once against the collapsed clamp) — a short description
// renders exactly as before, no dangling button.
export default function ExpandableText({ children, lines = 4, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflowing(el.scrollHeight - el.clientHeight > 1);
    // Re-measure only when the content/clamp itself changes — not on `expanded`, so the clamped
    // (collapsed) height is what gets measured even after the reader has expanded it once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, lines]);

  return (
    <div>
      <p
        ref={ref}
        className={className}
        style={
          expanded
            ? undefined
            : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
        }
      >
        {children}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[13px] font-semibold text-green hover:text-green-hover cursor-pointer"
        >
          {expanded ? 'Show less' : 'See more'}
        </button>
      )}
    </div>
  );
}
