// Shared card shell for every Product Detail page section below the hero — keeps spacing,
// corner radius, border, and heading style identical across Description, Specs, Reviews, etc.
export default function SectionCard({ title, subtitle, id, children, headerRight = null }) {
  return (
    <section id={id} className="bg-white border border-border rounded-2xl shadow-[0_1px_2px_rgba(20,40,32,0.05)] p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8 scroll-mt-24">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight m-0">{title}</h2>
          {subtitle && <p className="text-[13.5px] text-text-muted mt-1.5">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      {children}
    </section>
  );
}
