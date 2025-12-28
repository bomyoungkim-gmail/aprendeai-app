/**
 * Auth Route Group Layout
 * 
 * Shared layout for authentication pages (login, register, forgot password, etc.)
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AprendeAI - Autenticação',
  description: 'Login e registro na plataforma AprendeAI',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
