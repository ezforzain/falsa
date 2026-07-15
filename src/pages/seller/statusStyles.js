export const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STYLES = {
  Pending: 'bg-orange-tint text-orange-text',
  Processing: 'bg-[#E8F0FB] text-[#2D6FC9]',
  Shipped: 'bg-[#E8F3EE] text-green',
  Delivered: 'bg-green text-white',
  Cancelled: 'bg-surface-muted text-text-muted',
};

export function statusBadgeClass(status) {
  return STYLES[status] || 'bg-surface-muted text-text-muted';
}
