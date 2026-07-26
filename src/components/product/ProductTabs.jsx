import { useEffect, useRef, useState } from 'react';

// Segmented tab bar with a sliding active-indicator (measured against the real DOM button, so it
// stays pixel-accurate at any width/label length) and a cross-fade + slide-up on the content
// underneath each time the active tab changes. `tabs` is `[{ key, label, content }]`.
export default function ProductTabs({ tabs, defaultTab }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const btnRefs = useRef({});
  const railRef = useRef(null);

  const measure = () => {
    const btn = btnRefs.current[active];
    const rail = railRef.current;
    if (!btn || !rail) return;
    const btnRect = btn.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    setIndicator({ left: btnRect.left - railRect.left + rail.scrollLeft, width: btnRect.width });
  };

  useEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tabs.length]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const activeTab = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div>
      <div className="relative border-b border-border mb-6 sm:mb-8">
        <div ref={railRef} className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => {
                btnRefs.current[tab.key] = el;
              }}
              type="button"
              onClick={() => setActive(tab.key)}
              aria-current={active === tab.key}
              className={`shrink-0 px-4 sm:px-5 py-3.5 text-[14px] sm:text-[15px] font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200 ${
                active === tab.key ? 'text-green' : 'text-text-muted hover:text-ink-soft'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span
          className="absolute bottom-0 h-[2.5px] bg-green rounded-full transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      <div key={active} className="animate-fade-up">
        {activeTab?.content}
      </div>
    </div>
  );
}
