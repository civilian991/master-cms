'use client';

import { SessionProvider } from './SessionProvider';
import type { Session } from 'next-auth';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

/**
 * Central Providers Component
 * Combines all app-level providers for easier management
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

// Re-export individual providers for flexibility
export { SessionProvider } from './SessionProvider'; 