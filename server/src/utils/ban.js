// Shared ban logic so signin, the auth middleware, and the admin panel can never drift on what
// "banned" means. A user is banned when `status === 'suspended'`:
//   - `bannedUntil` in the future  -> temporary ban (auto-lifts once the date passes)
//   - `bannedUntil` null           -> permanent ban
// A temporary ban whose date has already passed is treated as not banned; call `liftExpiredBan`
// to actually clear the fields the next time that user is touched.

export function describeBan(user) {
  if (!user || user.status !== 'suspended') return { banned: false, expired: false };

  const until = user.bannedUntil ? new Date(user.bannedUntil) : null;
  if (until && until.getTime() <= Date.now()) {
    return { banned: false, expired: true };
  }

  const permanent = !until;
  const message = permanent
    ? 'Your account has been permanently banned. Contact support if you think this is a mistake.'
    : `Your account is banned until ${until.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}. Contact support if you think this is a mistake.`;

  return { banned: true, expired: false, permanent, until, message };
}

// Clears an expired temporary ban in place and persists it. Returns true if it changed anything.
export async function liftExpiredBan(user) {
  const { expired } = describeBan(user);
  if (!expired) return false;
  user.set({ status: 'active', bannedUntil: null, banReason: null });
  await user.save();
  return true;
}
