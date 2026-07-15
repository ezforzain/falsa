import { IconMessageCircle } from '../components/icons';

export default function MessengerPage() {
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">Messenger</h1>
      <p className="text-sm text-text-muted mb-7">Conversations with sellers about your orders and enquiries.</p>

      <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl">
        <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
          <IconMessageCircle width="22" height="22" className="text-text-muted" />
        </span>
        <p className="text-[16px] font-semibold text-ink mb-1.5">No messages yet</p>
        <p className="text-sm text-text-muted">When a seller replies to an enquiry, it'll show up here.</p>
      </div>
    </main>
  );
}
