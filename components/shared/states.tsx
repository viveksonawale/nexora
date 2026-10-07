import React from 'react';
import { NorButton } from '@/components/ui/nor-button';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}

export function ErrorState({ title = 'Error', message = 'Something went wrong.', onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <div className="text-red-500 font-bold text-lg">{title}</div>
      <p className="text-[var(--text-secondary)]">{message}</p>
      {onRetry && <NorButton onClick={onRetry}>Try Again</NorButton>}
    </div>
  );
}

export function EmptyState({ title = 'No data found', message = 'There is nothing to show here yet.', action }: { title?: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-elevated)]/30 p-8 m-4">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="text-[var(--text-secondary)] max-w-sm">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ForbiddenState({ message = "You don't have permission to view this page." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <div className="text-[var(--accent)] font-bold text-2xl">403</div>
      <h3 className="font-display text-xl">Access Denied</h3>
      <p className="text-[var(--text-secondary)]">{message}</p>
      <NorButton onClick={() => window.history.back()}>Go Back</NorButton>
    </div>
  );
}
