// Shared "coming soon" shell for drawer/menu destinations that don't have real content yet
// (Wishlist, Notifications, Settings, Help & Support, Privacy Policy, Terms, Account Center) —
// same empty-state card convention used elsewhere (see MessengerPage), so every menu item
// navigates somewhere real instead of a dead link.
export default function PlaceholderPage({ icon: Icon, title, description }) {
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">{title}</h1>
      <div className="text-center py-[60px] px-5 bg-surface border border-dashed border-border-strong rounded-2xl">
        <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
          <Icon width="22" height="22" className="text-text-muted" />
        </span>
        <p className="text-[16px] font-semibold text-ink mb-1.5">Coming soon</p>
        <p className="text-sm text-text-muted max-w-[420px] mx-auto">{description}</p>
      </div>
    </main>
  );
}
