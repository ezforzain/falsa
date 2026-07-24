import SectionCard from './SectionCard';
import { IconChevronDown } from '../icons';

export default function FaqSection({ faqs }) {
  return (
    <SectionCard title="Frequently Asked Questions" id="faq">
      <div className="flex flex-col gap-2.5">
        {faqs.map((faq) => (
          <details key={faq.q} className="group border border-border rounded-xl px-4 sm:px-5 open:bg-surface-muted/60 transition-colors">
            <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none text-[14px] font-semibold text-ink">
              {faq.q}
              <IconChevronDown className="text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180" width="14" height="14" />
            </summary>
            <p className="text-[13.5px] text-text leading-relaxed pb-4 pr-6 m-0">{faq.a}</p>
          </details>
        ))}
      </div>
    </SectionCard>
  );
}
