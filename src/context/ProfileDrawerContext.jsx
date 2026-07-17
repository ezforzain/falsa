import { createContext, useCallback, useContext, useState } from 'react';
import ProfileDrawer from '../components/ProfileDrawer';

const ProfileDrawerContext = createContext(null);

// A single global instance of the Facebook-style profile drawer, opened from anywhere (the
// bottom nav's "My Account" tab, the mobile top bar's profile icon) via useProfileDrawer()
// rather than each trigger owning its own copy of the open/closed state.
export function ProfileDrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ProfileDrawerContext.Provider value={{ isOpen, open, close }}>
      {children}
      <ProfileDrawer open={isOpen} onClose={close} />
    </ProfileDrawerContext.Provider>
  );
}

export function useProfileDrawer() {
  const ctx = useContext(ProfileDrawerContext);
  if (!ctx) throw new Error('useProfileDrawer must be used within a ProfileDrawerProvider');
  return ctx;
}
