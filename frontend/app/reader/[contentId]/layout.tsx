import type { Metadata } from 'next';
import AuthGuard from '@/components/auth-guard';

export const metadata: Metadata = {
  title: 'Cornell Reader - AprendeAI',
  description: 'Read and study with Cornell note-taking method',
};

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}

