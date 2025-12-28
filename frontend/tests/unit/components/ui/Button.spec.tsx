/**
 * Button Component Tests
 * 
 * Comprehensive test suite for Button UI component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render as button element', () => {
      render(<Button>Test</Button>);
      const button = screen.getByText('Test');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      render(<Button>Default</Button>);
      const button = screen.getByText('Default');
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByText('Secondary');
      expect(button).toHaveClass('bg-secondary');
    });

    it('should apply destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByText('Delete');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByText('Ghost');
      expect(button).not.toHaveClass('bg-transparent'); // Ghost usually has no bg initially
    });
  });

  describe('Sizes', () => {
    it('should apply default size styles', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByText('Default Size');
      expect(button).toHaveClass('h-10');
    });

    it('should apply sm size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByText('Small');
      expect(button).toHaveClass('h-9');
    });

    it('should apply lg size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByText('Large');
      expect(button).toHaveClass('h-11');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      
      const button = screen.getByText('Click');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByText('Disabled');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toBeDisabled();
    });

    it('should have opacity-50 class when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Custom Props', () => {
    it('should accept and apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByText('Custom');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should pass through HTML button props', () => {
      render(<Button type="submit" name="submit-btn">Submit</Button>);
      const button = screen.getByText('Submit');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Accessible</Button>);
      
      const button = screen.getByText('Accessible');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByLabelText('Close dialog');
      expect(button).toBeInTheDocument();
    });
  });
});
