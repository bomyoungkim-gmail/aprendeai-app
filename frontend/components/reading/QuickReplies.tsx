'use client';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

/**
 * QuickReplies - Clickable quick reply chips
 * Appears when AI provides suggested responses
 */
export function QuickReplies({ replies, onSelect, disabled }: QuickRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div className="quick-replies">
      <div className="quick-replies-label">Respostas rápidas:</div>
      <div className="quick-replies-list">
        {replies.map((reply, index) => (
          <button
            key={index}
            onClick={() => onSelect(reply)}
            disabled={disabled}
            className="quick-reply-chip"
            data-reply={reply}
            data-testid="quick-reply"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
