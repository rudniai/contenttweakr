export type Platform = 'reddit' | 'hackernews' | 'producthunt';
export type AIModel = 'sonnet' | 'opus';

export interface Opportunity {
  id?: string;
  date: string;
  subreddit: string;
  title: string;
  url: string;
  context: string;
  confidence: number;
  upvotes: number;
  comments: number;
  hidden?: boolean;
  repliedAt?: string | null;
  aiResponse?: string;
  aiResponseId?: string;
  aiResponseModel?: AIModel;
  platform?: Platform;
}

export interface ScanStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  hours: number;
  result_count: number | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  opportunities?: Opportunity[];
}
