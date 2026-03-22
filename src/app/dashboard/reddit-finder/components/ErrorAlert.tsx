'use client';

export type ErrorType = 'scan' | 'generation' | 'network' | 'generic';

interface ErrorAlertProps {
  message: string;
  type?: ErrorType;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const errorConfig: Record<ErrorType, { title: string; icon: string }> = {
  scan: { title: 'Scan Failed', icon: '🔍' },
  generation: { title: 'Response Generation Failed', icon: '✏️' },
  network: { title: 'Network Error', icon: '🌐' },
  generic: { title: 'Error', icon: '⚠️' },
};

export default function ErrorAlert({ message, type = 'generic', onDismiss, onRetry }: ErrorAlertProps) {
  const { title, icon } = errorConfig[type];

  return (
    <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-red-400">{message}</p>
        {type === 'network' && (
          <p className="text-xs text-red-500 mt-1">Check your internet connection and try again.</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs px-3 py-1.5 bg-red-800/40 hover:bg-red-700/40 text-red-200 rounded-md transition-colors border border-red-700/30"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-500 hover:text-red-300 transition-colors p-1"
            aria-label="Dismiss error"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
