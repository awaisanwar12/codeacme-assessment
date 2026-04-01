// src/app/layout.tsx
// Root layout for the application
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agency Pipeline - AI-Powered Brief Analysis',
  description: 'Automated project brief analysis, cost estimation, and pipeline management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}