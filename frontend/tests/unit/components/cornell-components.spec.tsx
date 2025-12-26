/**
 * Tests for Cornell Components
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CornellTypeSelector } from '@/components/cornell/CornellTypeSelector';
import { VisibilityControls } from '@/components/cornell/VisibilityControls';
import {
  AnnotationVisibility,
  ContextType,
  VisibilityScope,
} from '@/lib/constants/enums';

describe('CornellTypeSelector', () => {
  it('should render all type options', () => {
    const onChange = vi.fn();
    render(<CornellTypeSelector value="NOTE" onChange={onChange} />);

    expect(screen.getByText('Nota')).toBeInTheDocument();
    expect(screen.getByText('Questão')).toBeInTheDocument();
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Destaque')).toBeInTheDocument();
  });

  it('should call onChange when type is selected', () => {
    const onChange = vi.fn();
    render(<CornellTypeSelector value="NOTE" onChange={onChange} />);

    fireEvent.click(screen.getByText('Questão'));
    expect(onChange).toHaveBeenCalledWith('QUESTION');
  });

  it('should show selected state', () => {
    const onChange = vi.fn();
    render(<CornellTypeSelector value="STAR" onChange={onChange} />);

    const starButton = screen.getByText('Importante').closest('button');
    expect(starButton).toHaveClass('bg-yellow-50');
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(
      <CornellTypeSelector value="NOTE" onChange={onChange} disabled />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

describe('VisibilityControls', () => {
  it('should render visibility options', () => {
    const onChange = vi.fn();
    const config = { visibility: AnnotationVisibility.PRIVATE };

    render(<VisibilityControls config={config} onChange={onChange} />);

    expect(screen.getByText('Privado')).toBeInTheDocument();
    expect(screen.getByText('Grupo')).toBeInTheDocument();
    expect(screen.getByText('Público')).toBeInTheDocument();
  });

  it('should call onChange when visibility changes', () => {
    const onChange = vi.fn();
    const config = { visibility: AnnotationVisibility.PRIVATE };

    render(<VisibilityControls config={config} onChange={onChange} />);

    fireEvent.click(screen.getByText('Público'));
    expect(onChange).toHaveBeenCalledWith({
      visibility: AnnotationVisibility.PUBLIC,
    });
  });

  it('should show GROUP options when GROUP is selected', () => {
    const onChange = vi.fn();
    const config = {
      visibility: AnnotationVisibility.GROUP,
      contextType: ContextType.INSTITUTION,
      contextId: 'inst-1',
    };
    const contexts = [
      {
        type: ContextType.INSTITUTION,
        id: 'inst-1',
        name: 'My Institution',
      },
    ];

    render(
      <VisibilityControls
        config={config}
        onChange={onChange}
        availableContexts={contexts}
      />
    );

    expect(screen.getByText('Contexto')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar com')).toBeInTheDocument();
  });

  it('should show validation error for invalid config', () => {
    const onChange = vi.fn();
    const config = {
      visibility: AnnotationVisibility.GROUP,
      // Missing required fields
    };

    render(<VisibilityControls config={config} onChange={onChange} />);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('should show learner ID input for RESPONSIBLES_OF_LEARNER scope', () => {
    const onChange = vi.fn();
    const config = {
      visibility: AnnotationVisibility.GROUP,
      contextType: ContextType.INSTITUTION,
      contextId: 'inst-1',
      scope: VisibilityScope.RESPONSIBLES_OF_LEARNER,
    };

    render(<VisibilityControls config={config} onChange={onChange} />);

    expect(screen.getByText('ID do Aluno')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite o ID/i)).toBeInTheDocument();
  });
});
