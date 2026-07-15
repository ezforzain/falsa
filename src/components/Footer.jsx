import { Link } from 'react-router-dom';
import OfficialBadge from './OfficialBadge';

const columns = [
  {
    title: 'Marketplace',
    links: [
      { label: 'All categories', to: '/' },
      { label: 'Spotlight', to: '/spotlight' },
      { label: 'Trending now', to: '/' },
    ],
  },
  {
    title: 'For buyers',
    links: [
      { label: 'How it works', to: '/' },
      { label: 'Trade assurance', to: '/' },
      { label: 'Shipping & logistics', to: '/' },
    ],
  },
  {
    title: 'For sellers',
    links: [
      { label: 'Start selling', to: '/' },
      { label: 'Seller verification', to: '/' },
      { label: 'Success stories', to: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-footer text-[#9DB3A8] px-4 sm:px-6 lg:px-10 pt-[52px] pb-9">
      <div className="max-w-[1240px] mx-auto">
        <div className="grid gap-9 pb-9 border-b border-white/[0.08]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <span className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xl text-white">
                Falsafah<span className="text-orange">Tot</span>
              </span>
              <OfficialBadge size={16} />
            </span>
            <p className="text-[13.5px] leading-relaxed mt-3.5 max-w-[280px]">
              The trusted B2B marketplace — worldwide free shipping, verified sellers, secure trade.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-bold tracking-[0.1em] uppercase text-white mb-3.5">{col.title}</div>
              <div className="flex flex-col gap-2.5 text-[13.5px]">
                {col.links.map((link) => (
                  <Link key={link.label} to={link.to} className="text-inherit no-underline hover:text-white transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-6 text-[12.5px] flex-wrap gap-3">
          <span>© 2026 Falsafah Tot. All rights reserved.</span>
          <span>Worldwide Free Shipping · 100% Trusted B2B Marketplace</span>
        </div>
      </div>
    </footer>
  );
}
