import SellerCard from './SellerCard';

export default function StatCard({ label, value, note }) {
  return (
    <SellerCard eyebrow={label} className="gap-3.5">
      <div className="text-[26px] font-extrabold tracking-[-0.6px] text-ink">{value}</div>
      {note && <div className="text-xs text-text mt-1.5">{note}</div>}
    </SellerCard>
  );
}
