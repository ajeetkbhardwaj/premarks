import { useEffect, useState } from 'react';
import { RotateCcw, Upload, X } from 'lucide-react';
import type { BrandKitConfig } from '../types';
import {
  BRAND_FONT_CHOICES,
  applyBrandKit,
  extractBrandKit,
} from '../utils/brandKit';

interface BrandKitDrawerProps {
  markdown: string;
  onApplyMarkdown: (nextMarkdown: string) => void;
  onClose: () => void;
}

export function BrandKitDrawer({
  markdown,
  onApplyMarkdown,
  onClose,
}: BrandKitDrawerProps) {
  const [config, setConfig] = useState<BrandKitConfig>(() => extractBrandKit(markdown));

  useEffect(() => {
    setConfig(extractBrandKit(markdown));
  }, [markdown]);

  const updateAndApply = (patch: Partial<BrandKitConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onApplyMarkdown(applyBrandKit(markdown, next));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 120 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateAndApply({ logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetColors = () => {
    updateAndApply({
      accentColor: '',
      bgColor: '',
      inkColor: '',
      fontChoice: '',
      logoDataUrl: '',
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        role="dialog"
        aria-modal="true"
        aria-label="Brand Kit Customizer"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div>
          <h2 className="font-display text-sm font-bold text-neutral-950 dark:text-white">
            Brand Kit &amp; Layout Settings
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Customize colors, fonts, headers, and slide numbers without editing CSS
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Brand Kit"
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Header Text
            <input
              type="text"
              value={config.headerText}
              onChange={(e) => updateAndApply({ headerText: e.target.value })}
              placeholder="e.g., Department of Physics · Seminar"
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-normal text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
          </label>

          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Footer Text
            <input
              type="text"
              value={config.footerText}
              onChange={(e) => updateAndApply({ footerText: e.target.value })}
              placeholder="e.g., Premarks · Confidential"
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-normal text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-xs font-medium text-neutral-800 dark:border-neutral-800 dark:text-neutral-200">
            <span>Show Slide Numbers</span>
            <input
              type="checkbox"
              checked={config.paginate}
              onChange={(e) => updateAndApply({ paginate: e.target.checked })}
              className="h-4 w-4 accent-neutral-950 dark:accent-white"
            />
          </label>
        </div>

        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Color Overrides
            </span>
            <button
              type="button"
              onClick={handleResetColors}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Overrides
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <label className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 p-2 text-[11px] font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              Accent
              <input
                type="color"
                value={config.accentColor || '#c0392b'}
                onChange={(e) => updateAndApply({ accentColor: e.target.value })}
                className="h-7 w-full cursor-pointer rounded border-0 bg-transparent p-0"
              />
            </label>
            <label className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 p-2 text-[11px] font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              Canvas
              <input
                type="color"
                value={config.bgColor || '#fafafa'}
                onChange={(e) => updateAndApply({ bgColor: e.target.value })}
                className="h-7 w-full cursor-pointer rounded border-0 bg-transparent p-0"
              />
            </label>
            <label className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 p-2 text-[11px] font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              Text Ink
              <input
                type="color"
                value={config.inkColor || '#1a1a2e'}
                onChange={(e) => updateAndApply({ inkColor: e.target.value })}
                className="h-7 w-full cursor-pointer rounded border-0 bg-transparent p-0"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Slide Typography Override
            <select
              value={config.fontChoice}
              onChange={(e) => updateAndApply({ fontChoice: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            >
              {BRAND_FONT_CHOICES.map((f) => (
                <option key={f.label} value={f.cssFamily}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <span className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Corner Brand Mark (SVG / PNG &le; 120KB)
          </span>
          <div className="mt-2 flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Upload Logo
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
            {config.logoDataUrl && (
              <button
                type="button"
                onClick={() => updateAndApply({ logoDataUrl: '' })}
                className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
