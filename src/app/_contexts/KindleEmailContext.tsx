'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export interface KindleUser {
  name: string | null;
  email: string;
  kindleEmail: string;
}

interface KindleEmailContextType {
  selectedKindleEmail: KindleUser | null;
  setSelectedKindleEmail: (user: KindleUser | null) => void;
  availableKindleEmails: KindleUser[];
  setAvailableKindleEmails: (users: KindleUser[]) => void;
  refreshKindleEmails: () => Promise<void>;
}

const KindleEmailContext = createContext<KindleEmailContextType | undefined>(undefined);

export function KindleEmailProvider({ children }: { children: ReactNode }) {
  const [selectedKindleEmail, setSelectedKindleEmail] = useState<KindleUser | null>(null);
  const [availableKindleEmails, setAvailableKindleEmails] = useState<KindleUser[]>([]);
  const { data: session } = useSession();

  const refreshKindleEmails = useCallback(async () => {
    try {
      const response = await fetch('/api/users/kindle-emails');
      if (response.ok) {
        const users = await response.json() as KindleUser[];
        setAvailableKindleEmails(users);
        
        // If no selection, try to find and select the current user's email
        if (!selectedKindleEmail && users.length > 0 && session?.user?.email) {
          const currentUser = users.find(user => user.email === session.user.email);
          setSelectedKindleEmail(currentUser ?? users[0] ?? null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Kindle emails:', error);
    }
  }, [selectedKindleEmail, session?.user?.email]);

  return (
    <KindleEmailContext.Provider
      value={{
        selectedKindleEmail,
        setSelectedKindleEmail,
        availableKindleEmails,
        setAvailableKindleEmails,
        refreshKindleEmails,
      }}
    >
      {children}
    </KindleEmailContext.Provider>
  );
}

export function useKindleEmail() {
  const context = useContext(KindleEmailContext);
  if (context === undefined) {
    throw new Error('useKindleEmail must be used within a KindleEmailProvider');
  }
  return context;
}