import { useEffect, useMemo, useRef, useState } from 'react';
import { buildSlideFrameDocument } from '../utils/marpDocument';
import { renderMermaidInSlideHtml } from '../utils/mermaidRenderer';

export type SlideFrameVariant = 'stage' | 'stream' | 'card' | 'thumb';

interface SlideFrameProps {
  slideHtml: string;
  css: string;
  title: string;
  fragmentStep?: number;
  replayKey?: number;
  interactive?: boolean;
  variant?: SlideFrameVariant;
  placeholderTitle?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<SlideFrameVariant, string> = {
  stage:
    'rounded-lg ring-1 ring-black/10 shadow-[0_18px_48px_-14px_rgba(15,23,42,0.28)] dark:ring-white/15 dark:shadow-[0_22px_54px_-12px_rgba(0,0,0,0.75)]',
  stream:
    'rounded-[6px]',
  card:
    'rounded-md ring-1 ring-black/8 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.12)] dark:ring-white/10 dark:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.45)]',
  thumb:
    'rounded-[4px] ring-1 ring-black/10 dark:ring-white/12',
};

export function SlideFrame({
  slideHtml,
  css,
  title,
  fragmentStep = -1,
  replayKey = 0,
  interactive = false,
  variant = 'card',
  placeholderTitle,
  className = '',
}: SlideFrameProps) {
  const [enhancedHtml, setEnhancedHtml] = useState<string>(slideHtml);
  const lastHtmlRef = useRef<string>(slideHtml);

  useEffect(() => {
    let active = true;
    if (!slideHtml) {
      return;
    }
    lastHtmlRef.current = slideHtml;
    if (!slideHtml.includes('language-mermaid')) {
      setEnhancedHtml(slideHtml);
      return;
    }
    renderMermaidInSlideHtml(slideHtml)
      .then((res) => {
        if (active) setEnhancedHtml(res);
      })
      .catch(() => {
        if (active) setEnhancedHtml(slideHtml);
      });
    return () => {
      active = false;
    };
  }, [slideHtml]);

  const effectiveHtml = slideHtml ? enhancedHtml || slideHtml : '';

  const srcDoc = useMemo(() => {
    if (!effectiveHtml) return '';
    return buildSlideFrameDocument(effectiveHtml, css, fragmentStep);
  }, [effectiveHtml, css, fragmentStep]);

  const variantClasses = VARIANT_CLASSES[variant];

  if (!slideHtml) {
    return (
      <div
        className={`flex aspect-video w-full flex-col items-center justify-center overflow-hidden bg-neutral-100 px-3 text-center dark:bg-neutral-900 ${variantClasses} ${className}`}
      >
        {variant === 'thumb' ? (
          <div className="flex w-full flex-col items-start gap-1 px-1.5">
            <div className="h-1.5 w-2/3 rounded-xs bg-neutral-300 dark:bg-neutral-700" />
            <div className="h-1 w-full rounded-xs bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-1 w-4/5 rounded-xs bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ) : (
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {placeholderTitle || 'Rendering slide preview...'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-white dark:bg-neutral-900 ${variantClasses} ${className}`}
    >
      <iframe
        key={replayKey > 0 ? replayKey : undefined}
        title={title}
        srcDoc={srcDoc}
        sandbox=""
        className={`block h-full w-full border-0 ${interactive ? '' : 'pointer-events-none'}`}
      />
    </div>
  );
}
