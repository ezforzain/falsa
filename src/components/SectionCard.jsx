// Shared card wrapper (icon + title + description + content) used by Settings and Account
// Center so the two pages stay visually identical instead of drifting apart.
export default function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(27,31,29,0.04)]">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-10 h-10 rounded-xl bg-green-tint text-green flex items-center justify-center shrink-0">
          <Icon width="19" height="19" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-display text-[17px] font-bold text-ink m-0 tracking-tight">{title}</h2>
          <p className="text-[13px] text-text-muted mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
