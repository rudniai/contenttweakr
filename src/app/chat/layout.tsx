import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Chatbase — AI Chatbots for Your Website',
    template: '%s | Chatbase',
  },
  description:
    'Build AI chatbots trained on your own content. Upload documents, add URLs, and deploy a chat widget to your site in minutes.',
};

export default function ChatbasePublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
