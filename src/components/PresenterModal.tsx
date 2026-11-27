import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';

interface PresenterModalProps {
  title: string;
  htmlContent: string | null;
  srcUrl?: string | null;
  isEmbedded?: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onDownloadHtml?: () => void;
}

export function PresenterModal({
  title,
  htmlContent,
  srcUrl,
  isEmbedded = false,
  isLoading,
  error,
  onClose,
  onDownloadHtml,
}: PresenterModalProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Ignore fullscreen denial inside sandboxed iframes
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEmbedded && !document.fullscreenElement) {
        onClose();
        return;
      }
      if (e.key.toLowerCase() === 'f' && !isEmbedded) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEmbedded, onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-neutral-100"
      role="dialog"
      aria-modal="true"
      aria-label={`Presentation player: ${title}`}
    >
      {!isEmbedded && (
        <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-neutral-800/90 bg-neutral-950 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate font-display text-sm font-semibold text-white">
              {title}
            </span>
            <span className="hidden text-xs text-neutral-400 md:inline">
              Space / Arrows advance · R replay · B blackout · F fullscreen
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
              className="hidden rounded-md border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white sm:inline-flex"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {onDownloadHtml && htmlContent && (
              <button
                type="button"
                onClick={onDownloadHtml}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-800 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download HTML
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-colors hover:bg-neutral-200 whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Exit
            </button>
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 bg-black">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Building animated HTML presentation...
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-medium text-red-400">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
            >
              Return to Studio
            </button>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {srcUrl ? (
              <iframe
                title={title}
                src={srcUrl}
                sandbox="allow-scripts"
                className="h-full w-full border-0"
              />
            ) : htmlContent ? (
              <iframe
                title={title}
                srcDoc={htmlContent}
                sandbox="allow-scripts"
                className="h-full w-full border-0"
              />
            ) : null}

            {/* Floating Google Slides-style Bottom-Left Presenter Dock */}
            {!isEmbedded && (
              <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950/85 px-2.5 py-1.5 text-xs text-neutral-200 opacity-45 backdrop-blur-md transition-opacity hover:opacity-100">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-neutral-200 hover:bg-neutral-800 whitespace-nowrap"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {isFullscreen ? 'Window' : 'Fullscreen'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white whitespace-nowrap"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Exit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
