import SectionCard from './SectionCard';
import { IconBox, IconTruck, IconClock, IconGlobe } from '../icons';

export default function PackagingShipping({ info }) {
  const rows = [
    { icon: IconBox, label: 'Packaging', value: info.packaging },
    { icon: IconBox, label: 'Unit weight', value: info.weight },
    { icon: IconClock, label: 'Lead time', value: info.leadTime },
    { icon: IconGlobe, label: 'Shipping ports', value: info.ports },
    { icon: IconTruck, label: 'Shipping methods', value: info.methods },
  ];

  return (
    <SectionCard title="Packaging & Shipping" id="packaging">
      <div className="grid sm:grid-cols-2 gap-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3 bg-surface-muted rounded-xl px-4 py-3.5">
            <span className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shrink-0 text-green mt-0.5">
              <Icon width="15" height="15" />
            </span>
            <div className="min-w-0">
              <div className="text-[11.5px] text-text-muted font-medium mb-0.5">{label}</div>
              <div className="text-[13.5px] font-semibold text-ink leading-snug">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
