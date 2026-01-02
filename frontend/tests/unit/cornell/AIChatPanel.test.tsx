const vi = jest;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChatPanel } from '@/components/cornell/AIChatPanel';
import { CHAT_LABELS } from '@/lib/cornell/labels';

describe('AIChatPanel', () => {
  const mockHandlers = {
    onClose: vi.fn(),
  };

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AIChatPanel isOpen={false} {...mockHandlers} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render correct title and labels', () => {
    render(<AIChatPanel isOpen={true} {...mockHandlers} />);

    expect(screen.getByText(CHAT_LABELS.TITLE)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(CHAT_LABELS.PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText(CHAT_LABELS.EMPTY_STATE)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<AIChatPanel isOpen={true} {...mockHandlers} />);

    const closeButton = screen.getByLabelText(CHAT_LABELS.CLOSE);
    fireEvent.click(closeButton);

    expect(mockHandlers.onClose).toHaveBeenCalled();
  });

  it('should add user message when form submitted', async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Resposta simulada da API' }),
    });

    render(<AIChatPanel isOpen={true} {...mockHandlers} />);

    const input = screen.getByPlaceholderText(CHAT_LABELS.PLACEHOLDER);
    const sendButton = screen.getByLabelText(CHAT_LABELS.SEND);

    fireEvent.change(input, { target: { value: 'O que é React?' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('O que é React?')).toBeInTheDocument();
    expect(input).toHaveValue('');
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'), 
        expect.anything()
    );
  });

  it('should show typing indicator after sending message', async () => {
    // Mock slow fetch to check loading state
    global.fetch = vi.fn().mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                ok: true,
                json: async () => ({ content: 'Resposta' })
            });
        }, 500);
    }));

    vi.useFakeTimers();
    render(<AIChatPanel isOpen={true} {...mockHandlers} />);

    const input = screen.getByPlaceholderText(CHAT_LABELS.PLACEHOLDER);
    const sendButton = screen.getByLabelText(CHAT_LABELS.SEND);

    fireEvent.change(input, { target: { value: 'Teste' } });
    fireEvent.click(sendButton);

    // Should indicate typing
    expect(input).toBeDisabled();

    // Advance timer to trigger fetch resolution (if setTimeout was used inside fetch polyfill, 
    // but here we just need to wait for promise. 
    // Actually vi.runAllTimers() helps if fetch implementation uses timers.
    // But mostly we check immediate state.)
    
    vi.useRealTimers();
  });
});
