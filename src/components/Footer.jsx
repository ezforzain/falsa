import { Link } from 'react-router-dom';
import OfficialBadge from './OfficialBadge';

// Desktop-only column set — kept to two links each so the whole footer stays compact and
// premium rather than reading as a full site map.
const columns = [
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/' },
      { label: 'Contact', to: '/' },
    ],
  },
  {
    title: 'Marketplace',
    links: [
      { label: 'All categories', to: '/' },
      { label: 'Spotlight', to: '/spotlight' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/' },
      { label: 'Terms', to: '/' },
    ],
  },
];

// Mobile shows only this flat set — no column headings, no site map — so the footer stays out
// of the way of the product content above it.
const essentialLinks = [
  { label: 'About', to: '/' },
  { label: 'Contact', to: '/' },
  { label: 'Privacy Policy', to: '/' },
  { label: 'Terms', to: '/' },
];

export default function Footer() {
  return (
    <footer className="bg-green-deep text-teal-mist">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        {/* Desktop — clean 4-column layout, minimal spacing */}
        <div
          className="hidden sm:grid gap-8 pb-6 border-b border-white/10"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
        >
          <div>
            <span className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Falsafah
              </span>
              <OfficialBadge size={14} />
            </span>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-3">{col.title}</div>
              <div className="flex flex-col gap-2 text-[13px]">
                {col.links.map((link) => (
                  <Link key={link.label} to={link.to} className="text-inherit no-underline hover:text-white transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile — brand mark + essential links only */}
        <div className="sm:hidden flex flex-col items-center gap-4 pb-5 border-b border-white/10 text-center">
          <span className="flex items-center gap-1.5">
            <span className="font-display font-bold text-base text-white tracking-tight">
              Falsafah
            </span>
            <OfficialBadge size={13} />
          </span>
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12.5px]">
            {essentialLinks.map((link) => (
              <Link key={link.label} to={link.to} className="text-inherit no-underline hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5 pt-4 text-[11.5px] text-teal-mist/70 text-center sm:text-left">
          <span>© 2026 Falsafah. All rights reserved.</span>
          <span>Worldwide Free Shipping · 100% Trusted B2B Marketplace</span>
        </div>
      </div>
    </footer>
  );
}
