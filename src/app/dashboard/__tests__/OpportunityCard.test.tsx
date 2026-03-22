// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(cleanup);
import OpportunityCard from '../reddit-finder/components/OpportunityCard';
import type { Opportunity } from '../reddit-finder/components/types';

const baseOpp: Opportunity = {
  id: 'opp-1',
  date: '2026-03-23T00:00:00Z',
  subreddit: 'webdev',
  title: 'Need help with my website speed',
  url: 'https://reddit.com/r/webdev/comments/abc123',
  context: 'My site loads slowly and I need advice.',
  confidence: 85,
  upvotes: 12,
  comments: 5,
  hidden: false,
  repliedAt: null,
};

const defaultProps = {
  opportunity: baseOpp,
  index: 0,
  isGenerating: false,
  isHiding: false,
  copiedIdx: null,
  onGenerateResponse: vi.fn(),
  onCopyToClipboard: vi.fn(),
  onHide: vi.fn(),
  onMarkReplied: vi.fn(),
  isMarkingReplied: false,
};

describe('OpportunityCard', () => {
  it('renders opportunity title and subreddit', () => {
    render(<OpportunityCard {...defaultProps} />);

    expect(screen.getByText('Need help with my website speed')).toBeInTheDocument();
    expect(screen.getByText('r/webdev')).toBeInTheDocument();
  });

  it('renders confidence badge with correct text', () => {
    render(<OpportunityCard {...defaultProps} />);

    expect(screen.getByText('85% match')).toBeInTheDocument();
  });

  it('renders upvotes and comments', () => {
    render(<OpportunityCard {...defaultProps} />);

    const stats = screen.getAllByText(/upvotes/);
    expect(stats.length).toBeGreaterThan(0);
  });

  it('renders context text', () => {
    render(<OpportunityCard {...defaultProps} />);

    expect(screen.getByText('My site loads slowly and I need advice.')).toBeInTheDocument();
  });

  it('shows Generate Response button when no AI response', () => {
    render(<OpportunityCard {...defaultProps} />);

    expect(screen.getByText('Generate Response')).toBeInTheDocument();
  });

  it('calls onGenerateResponse when button is clicked', () => {
    const onGenerate = vi.fn();
    render(<OpportunityCard {...defaultProps} onGenerateResponse={onGenerate} />);

    fireEvent.click(screen.getByText('Generate Response'));
    expect(onGenerate).toHaveBeenCalledWith(0);
  });

  it('shows loading skeleton when generating', () => {
    render(<OpportunityCard {...defaultProps} isGenerating={true} />);

    expect(screen.getByText('Generating response...')).toBeInTheDocument();
    expect(screen.queryByText('Generate Response')).not.toBeInTheDocument();
  });

  it('shows AI response when available', () => {
    const opp = { ...baseOpp, aiResponse: 'Try using PageSpeed Insights.' };
    render(<OpportunityCard {...defaultProps} opportunity={opp} />);

    expect(screen.getByText('Generated Response')).toBeInTheDocument();
    expect(screen.getByText('Try using PageSpeed Insights.')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('shows Replied badge when repliedAt is set', () => {
    const opp = { ...baseOpp, repliedAt: '2026-03-23T01:00:00Z', aiResponse: 'Done.' };
    render(<OpportunityCard {...defaultProps} opportunity={opp} />);

    expect(screen.getByText('Replied')).toBeInTheDocument();
    // Mark as Replied button should NOT be visible
    expect(screen.queryByText('Mark as Replied')).not.toBeInTheDocument();
  });

  it('shows Mark as Replied button when response exists and not yet replied', () => {
    const opp = { ...baseOpp, aiResponse: 'Some response.' };
    render(<OpportunityCard {...defaultProps} opportunity={opp} />);

    expect(screen.getByText('Mark as Replied')).toBeInTheDocument();
  });

  it('calls onHide when hide button is clicked', () => {
    const onHide = vi.fn();
    render(<OpportunityCard {...defaultProps} onHide={onHide} />);

    const hideBtn = screen.getByTitle('Hide opportunity');
    fireEvent.click(hideBtn);
    expect(onHide).toHaveBeenCalledWith(baseOpp);
  });

  it('enters edit mode when Edit is clicked', () => {
    const opp = { ...baseOpp, aiResponse: 'Original response.' };
    render(<OpportunityCard {...defaultProps} opportunity={opp} />);

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCopyToClipboard when Copy is clicked', () => {
    const onCopy = vi.fn();
    const opp = { ...baseOpp, aiResponse: 'Copy me.' };
    render(<OpportunityCard {...defaultProps} opportunity={opp} onCopyToClipboard={onCopy} />);

    fireEvent.click(screen.getByText('Copy'));
    expect(onCopy).toHaveBeenCalledWith('Copy me.', 0);
  });

  it('shows Copied! when copiedIdx matches', () => {
    const opp = { ...baseOpp, aiResponse: 'Response.' };
    render(<OpportunityCard {...defaultProps} opportunity={opp} copiedIdx={0} />);

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('renders checkbox when onSelect is provided', () => {
    const onSelect = vi.fn();
    render(<OpportunityCard {...defaultProps} onSelect={onSelect} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(onSelect).toHaveBeenCalledWith(baseOpp);
  });

  it('applies reduced opacity when hidden', () => {
    const opp = { ...baseOpp, hidden: true };
    const { container } = render(<OpportunityCard {...defaultProps} opportunity={opp} />);

    expect(container.firstChild).toHaveClass('opacity-50');
  });
});
