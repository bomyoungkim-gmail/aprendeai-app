import React from 'react';
import { Trash2 } from 'lucide-react';

export type DeleteButtonVariant = 'default' | 'subtle' | 'danger';

interface DeleteButtonProps {
  onDelete?: () => void;
  variant?: DeleteButtonVariant;
  title?: string;
  className?: string;
}

/**
 * Reusable delete button component
 * Used across all stream cards to maintain consistency
 */
export const DeleteButton = React.memo(function DeleteButton({
  onDelete,
  variant = 'default',
  title = 'Delete',
  className = '',
}: DeleteButtonProps) {
  const variantStyles: Record<DeleteButtonVariant, string> = {
    default: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    subtle: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    danger: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete?.();
      }}
      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${variantStyles[variant]} ${className}`}
      title={title}
      aria-label={title}
    >
      <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
    </button>
  );
});
