import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingState = ({ message = 'Loading sensor data...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-25" />
      </div>
      <p className="text-sm font-medium text-slate-300 font-mono tracking-wide">{message}</p>
      <span className="text-xs text-slate-500">Connecting to telemetry network</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-950/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl min-h-[220px] flex items-center justify-center border border-slate-800">
      {content}
    </div>
  );
};

export const ErrorState = ({ message = 'An error occurred loading telemetry.', onRetry }) => {
  return (
    <div className="glass-panel rounded-xl p-8 border border-red-500/30 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto my-6">
      <div className="p-3 bg-red-950/60 text-red-400 rounded-full border border-red-500/40">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-slate-100">Telemetry Stream Error</h4>
        <p className="text-xs text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};

export default LoadingState;
