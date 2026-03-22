// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ScanControls from '../reddit-finder/components/ScanControls';
import type { ScanStatus } from '../reddit-finder/components/types';

afterEach(cleanup);

const defaultProps = {
  selectedHours: 24,
  onSelectedHoursChange: vi.fn(),
  loading: false,
  scanStatus: null,
  onFindOpportunities: vi.fn(),
};

describe('ScanControls', () => {
  it('renders time range selector and button', () => {
    render(<ScanControls {...defaultProps} />);

    expect(screen.getByText('Time Range')).toBeInTheDocument();
    expect(screen.getByText('Find Opportunities')).toBeInTheDocument();
  });

  it('shows correct selected hours', () => {
    render(<ScanControls {...defaultProps} selectedHours={48} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('48');
  });

  it('calls onSelectedHoursChange when selection changes', () => {
    const onChange = vi.fn();
    render(<ScanControls {...defaultProps} onSelectedHoursChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '72' } });
    expect(onChange).toHaveBeenCalledWith(72);
  });

  it('calls onFindOpportunities when button is clicked', () => {
    const onFind = vi.fn();
    render(<ScanControls {...defaultProps} onFindOpportunities={onFind} />);

    fireEvent.click(screen.getByText('Find Opportunities'));
    expect(onFind).toHaveBeenCalled();
  });

  it('disables button when loading', () => {
    render(<ScanControls {...defaultProps} loading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows scanning text when loading', () => {
    render(<ScanControls {...defaultProps} loading={true} />);

    expect(screen.getByText('Scanning...')).toBeInTheDocument();
  });

  it('shows scan progress when scanning with status', () => {
    const scanStatus: ScanStatus = {
      id: 'scan-1',
      status: 'processing',
      hours: 24,
      result_count: null,
      error: null,
      created_at: '2026-03-23T00:00:00Z',
      completed_at: null,
    };

    render(
      <ScanControls
        {...defaultProps}
        loading={true}
        scanStatus={scanStatus}
      />
    );

    expect(screen.getByText('Scanning Reddit...')).toBeInTheDocument();
  });

  it('shows pending status text', () => {
    const scanStatus: ScanStatus = {
      id: 'scan-1',
      status: 'pending',
      hours: 24,
      result_count: null,
      error: null,
      created_at: '2026-03-23T00:00:00Z',
      completed_at: null,
    };

    render(
      <ScanControls
        {...defaultProps}
        loading={true}
        scanStatus={scanStatus}
      />
    );

    expect(screen.getByText('Starting scan...')).toBeInTheDocument();
  });

  it('disables select when loading', () => {
    render(<ScanControls {...defaultProps} loading={true} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('has all expected hour options', () => {
    render(<ScanControls {...defaultProps} />);

    const options = screen.getAllByRole('option');
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).toContain('Last 12 hours');
    expect(optionTexts).toContain('Last 24 hours');
    expect(optionTexts).toContain('Last 48 hours');
    expect(optionTexts).toContain('Last 3 days');
  });
});
