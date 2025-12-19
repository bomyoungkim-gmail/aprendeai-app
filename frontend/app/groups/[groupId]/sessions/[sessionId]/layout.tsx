import { SessionProvider } from '@/contexts/SessionContext';

interface SessionLayoutProps {
  children: React.ReactNode;
  params: {
    sessionId: string;
  };
}

export default function SessionLayout({ children, params }: SessionLayoutProps) {
  return (
    <SessionProvider sessionId={params.sessionId}>
      {children}
    </SessionProvider>
  );
}
