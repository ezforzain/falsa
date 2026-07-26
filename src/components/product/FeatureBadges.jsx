import { IconDroplet, IconBattery, IconRadio, IconBox, IconPin, IconShield, IconSparkle, IconCheck } from '../icons';

// Best-guess icon for a spec highlight based on its label/value text — keeps the badge row
// visually varied (like a product page showing "IPX4 / 10H Playing Time / 10m Range" as icon
// pills) without hardcoding icons per category, since this catalog spans fabric, tools, food,
// and more rather than a single product type.
function iconFor(label, value) {
  const text = `${label} ${value}`.toLowerCase();
  if (/water|ipx|moisture/.test(text)) return IconDroplet;
  if (/battery|power|hour|playing|charge/.test(text)) return IconBattery;
  if (/transmission|wireless|bluetooth|range|signal|frequency/.test(text)) return IconRadio;
  if (/origin|location|made in|port/.test(text)) return IconPin;
  if (/certif|iso|warranty|guarantee|compliance|assurance/.test(text)) return IconShield;
  if (/color|colour|finish|design/.test(text)) return IconSparkle;
  if (/material|weight|fabric|packaging|construction|steel|leather|cotton/.test(text)) return IconBox;
  return IconCheck;
}

// Icon badge row for the top of the Overview tab — short spec highlights presented as attractive
// pills instead of buried in the full specifications table further down.
export default function FeatureBadges({ highlights }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {highlights.map(({ label, value }) => {
        const Icon = iconFor(label, value);
        return (
          <div
            key={label}
            className="flex items-center gap-2 bg-green-tint border border-green-tint-border rounded-xl pl-2.5 pr-3.5 py-2"
          >
            <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 text-green">
              <Icon width="14" height="14" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-[10.5px] text-text-muted font-medium">{label}</div>
              <div className="text-[12.5px] font-bold text-ink-soft truncate max-w-[140px]">{value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
