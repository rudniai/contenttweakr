import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FSA ContentTweakr - Content Marketing Intelligence',
  description:
    'Find genuine opportunities on Reddit. Generate human-like responses. Build karma organically with AI-powered content marketing.',
};

export default function FsaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
