import SectionCard from './SectionCard';
import { IconCheck } from '../icons';

export default function ProductFeatures({ features }) {
  return (
    <SectionCard title="Product Features" id="features">
      <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4 list-none m-0 p-0">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[14px] text-text leading-snug">
            <span className="w-5 h-5 rounded-full bg-green-tint flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck width="11" height="11" className="text-green" strokeWidth="3" />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
