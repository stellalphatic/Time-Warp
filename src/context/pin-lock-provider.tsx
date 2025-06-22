"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-provider';

const LOCK_TIMEOUT = 2 * 60 * 1000; // 2 minutes

interface PinLockContextType {
  isLocked: boolean;
  verifyPin: (pin: string) => Promise<boolean>;
}

const PinLockContext = createContext<PinLockContextType | undefined>(undefined);

export function PinLockProvider({ children }: { children: ReactNode }) {
  const { user, userProfile } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  let activityTimeout: NodeJS.Timeout;

  const resetActivityTimeout = useCallback(() => {
    clearTimeout(activityTimeout);
    if (user) {
      activityTimeout = setTimeout(() => setIsLocked(true), LOCK_TIMEOUT);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const events = ['mousemove', 'keydown', 'scroll', 'click'];
      events.forEach(event => window.addEventListener(event, resetActivityTimeout));
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          setIsLocked(true);
        }
      });
      resetActivityTimeout();
    } else {
        clearTimeout(activityTimeout);
    }

    return () => {
      clearTimeout(activityTimeout);
      const events = ['mousemove', 'keydown', 'scroll', 'click'];
      events.forEach(event => window.removeEventListener(event, resetActivityTimeout));
      window.removeEventListener('visibilitychange', () => {});
    };
  }, [user, resetActivityTimeout]);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    if (userProfile && userProfile.pin === pin) {
      setIsLocked(false);
      resetActivityTimeout();
      return true;
    }
    return false;
  }, [userProfile, resetActivityTimeout]);

  const value = { isLocked: !!user && isLocked, verifyPin };

  return (
    <PinLockContext.Provider value={value}>
      {children}
    </PinLockContext.Provider>
  );
}

export const usePinLock = () => {
  const context = useContext(PinLockContext);
  if (context === undefined) {
    throw new Error('usePinLock must be used within a PinLockProvider');
  }
  return context;
};
