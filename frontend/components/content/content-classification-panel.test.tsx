import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentClassificationPanel from './content-classification-panel';

// Mock fetch
global.fetch = jest.fn();

describe('ContentClassificationPanel', () => {
  const mockOnSave = jest.fn();
  
  const defaultProps = {
    contentId: 'content-123',
    title: 'Test Content',
    description: 'Test Description',
    onSave: mockOnSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    localStorage.setItem('token', 'test-token');
  });

  it('should render classification panel', () => {
    render(<ContentClassificationPanel {...defaultProps} />);
    
    expect(screen.getByText('Content Age Classification')).toBeInTheDocument();
    expect(screen.getByText('🤖 Get AI Suggestion')).toBeInTheDocument();
  });

  it('should display current classification values', () => {
    const propsWithClassification = {
      ...defaultProps,
      currentClassification: {
        ageMin: 8,
        ageMax: 12,
        complexity: 'INTERMEDIATE',
      },
    };

    render(<ContentClassificationPanel {...propsWithClassification} />);
    
    expect(screen.getByText(/Minimum Age: 8/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum Age: 12/)).toBeInTheDocument();
  });

  it('should fetch AI suggestion when button clicked', async () => {
    const mockSuggestion = {
      suggested: {
        ageMin: 10,
        ageMax: 14,
        complexity: 'INTERMEDIATE',
        contentRating: 'PG',
        topics: ['math', 'science'],
        confidence: 0.9,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuggestion,
    });

    render(<ContentClassificationPanel {...defaultProps} />);
    
    const button = screen.getByText('🤖 Get AI Suggestion');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
      expect(screen.getByText(/Age: 10-14/)).toBeInTheDocument();
      expect(screen.getByText(/Confidence: 90%/)).toBeInTheDocument();
    });
  });

  it('should allow manual age adjustment', () => {
    render(<ContentClassificationPanel {...defaultProps} />);
    
    const minAgeSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(minAgeSlider, { target: { value: '8' } });
    
    expect(screen.getByText(/Minimum Age: 8/)).toBeInTheDocument();
  });

  it('should call onSave when saved', () => {
    render(<ContentClassificationPanel {...defaultProps} />);
    
    const saveButton = screen.getByText('Save Classification');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      ageMin: expect.any(Number),
      ageMax: expect.any(Number),
      complexity: expect.any(String),
    });
  });

  it('should apply AI suggestion when button clicked', async () => {
    const mockSuggestion = {
      suggested: {
        ageMin: 10,
        ageMax: 14,
        complexity: 'ADVANCED',
        contentRating: 'PG-13',
        topics: [],
        confidence: 0.85,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuggestion,
    });

    render(<ContentClassificationPanel {...defaultProps} />);
    
    // Get AI suggestion first
    const getSuggestionBtn = screen.getByText('🤖 Get AI Suggestion');
    fireEvent.click(getSuggestionBtn);

    await waitFor(() => screen.getByText('Apply'));

    // Apply suggestion
    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText(/Minimum Age: 10/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum Age: 14/)).toBeInTheDocument();
    });
  });
});
