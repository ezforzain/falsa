import SectionCard from './SectionCard';

export default function ProductSpecifications({ specs }) {
  return (
    <SectionCard title="Product Specifications" id="specifications">
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0 border-t border-border">
        {specs.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 border-b border-border">
            <span className="text-[13.5px] text-text-muted">{label}</span>
            <span className="text-[13.5px] font-semibold text-ink text-right">{value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
