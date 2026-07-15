// Native <input placeholder> text can't be transitioned smoothly (browsers just swap it
// instantly), so the rotating hint is rendered as its own absolutely-positioned layer on top
// of an empty input instead. Keying the span by `hint` forces React to remount it on every
// rotation, which re-triggers the fade/slide-in CSS animation for free. `pointer-events-none`
// means clicks always pass straight through to the real input beneath it.
export default function SearchHintOverlay({ hint, visible, className = '' }) {
  if (!visible) return null;
  return (
    <span
      key={hint}
      className={`absolute inset-0 flex items-center pointer-events-none text-text-muted text-sm font-sans animate-fade-up truncate ${className}`}
    >
      Search &quot;{hint}&quot;
    </span>
  );
}
