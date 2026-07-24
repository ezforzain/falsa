import SectionCard from './SectionCard';
import { IconShield } from '../icons';

export default function CertificationsSection({ items }) {
  return (
    <SectionCard title="Certifications" id="certifications">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((cert) => (
          <div key={cert.name} className="flex flex-col items-center text-center gap-2.5 border border-border rounded-xl px-4 py-5 hover:border-border-strong transition-colors">
            <span className="w-11 h-11 rounded-full bg-green-tint flex items-center justify-center text-green">
              <IconShield width="20" height="20" />
            </span>
            <div className="text-[13.5px] font-bold text-ink">{cert.name}</div>
            <div className="text-[11.5px] text-text-muted leading-snug">{cert.desc}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
