import SectionCard from './SectionCard';

export default function CompanyProfileSection({ profile }) {
  const rows = [
    { label: 'Business Type', value: profile.businessType },
    { label: 'Year Established', value: profile.foundedYear },
    { label: 'Total Staff', value: profile.staffCount },
    { label: 'Annual Revenue', value: profile.annualRevenue },
    { label: 'Main Markets', value: profile.mainMarkets.join(', ') },
  ];

  return (
    <SectionCard title="Company Profile" id="company">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(({ label, value }) => (
          <div key={label} className="border border-border rounded-xl px-4 py-3.5">
            <div className="text-[11.5px] text-text-muted font-medium mb-1">{label}</div>
            <div className="text-[13.5px] font-semibold text-ink">{value}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
