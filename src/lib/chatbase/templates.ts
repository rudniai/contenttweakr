export type Template = {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  systemPrompt: string;
  welcomeMessage: string;
  primaryColor: string;
  icon: string;
  tags: string[];
};

export const TEMPLATES: Template[] = [
  {
    slug: 'customer-support',
    name: 'Customer Support Bot',
    description: 'Handle common support questions, reduce ticket volume, and delight customers 24/7.',
    longDescription: 'Perfect for SaaS, e-commerce, and service businesses. Pre-configured to handle FAQs, order status, returns, and escalation to human support.',
    systemPrompt: 'You are a friendly and helpful customer support assistant. Answer questions based only on the provided knowledge base documents. If you cannot find the answer, politely let the customer know and suggest they contact human support. Always be empathetic and professional.',
    welcomeMessage: 'Hi there! 👋 How can I help you today?',
    primaryColor: '#6366f1',
    icon: '🎧',
    tags: ['Support', 'E-commerce', 'SaaS'],
  },
  {
    slug: 'faq',
    name: 'FAQ Bot',
    description: 'Instantly answer your most common questions so your team can focus on what matters.',
    longDescription: 'Upload your FAQ document or help center articles and this bot will answer questions accurately and concisely. Ideal for any website that wants to reduce repetitive support queries.',
    systemPrompt: 'You are a concise and accurate FAQ assistant. Answer questions based strictly on the provided FAQ documents. Keep answers brief and to the point. If a question is not covered in the FAQs, say so clearly.',
    welcomeMessage: "Hello! Ask me anything — I'll do my best to help.",
    primaryColor: '#0ea5e9',
    icon: '❓',
    tags: ['FAQ', 'Help Center', 'Documentation'],
  },
  {
    slug: 'sales-assistant',
    name: 'Sales Assistant',
    description: 'Convert more visitors into leads by answering product questions and capturing contact info.',
    longDescription: 'Train the bot on your product catalog, pricing, and feature comparisons. It will guide prospects through the buying journey and help qualify leads before they talk to sales.',
    systemPrompt: 'You are an enthusiastic sales assistant for our products. Help prospects understand our offerings, answer questions about features and pricing based on the provided documents, and encourage them to take the next step. Be persuasive but never pushy.',
    welcomeMessage: "Welcome! I'd love to help you find the perfect solution. What are you looking for?",
    primaryColor: '#10b981',
    icon: '💼',
    tags: ['Sales', 'Lead Generation', 'E-commerce'],
  },
  {
    slug: 'onboarding-guide',
    name: 'Onboarding Guide',
    description: 'Help new users get up to speed quickly with step-by-step guidance and answers.',
    longDescription: 'Upload your onboarding docs, tutorials, and getting-started guides. New users will get instant, accurate help at every step — reducing churn and support burden.',
    systemPrompt: 'You are a patient and encouraging onboarding assistant. Guide new users step by step based on the provided onboarding documentation. Celebrate their progress and make sure they feel confident at every step.',
    welcomeMessage: "Welcome aboard! 🚀 I'm here to help you get started. What would you like to learn first?",
    primaryColor: '#f59e0b',
    icon: '🚀',
    tags: ['Onboarding', 'SaaS', 'Education'],
  },
];

export function getTemplateBySlug(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
