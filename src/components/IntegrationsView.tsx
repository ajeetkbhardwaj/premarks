import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  Code2,
  Copy,
  Download,
  KeyRound,
  LogIn,
  Plus,
  Terminal,
  Trash2,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type {
  ApiKeySummary,
  TemplateItem,
  ThemeItem,
} from '../types';

interface IntegrationsViewProps {
  templates: TemplateItem[];
  themes: ThemeItem[];
  onOpenStudio: () => void;
}

type IntegrationTab = 'vscode' | 'cli' | 'mcp' | 'ci';
type McpClientTab = 'claude' | 'cursor' | 'vscode' | 'stdio';

export function IntegrationsView({
  templates,
  themes,
  onOpenStudio,
}: IntegrationsViewProps) {
  const { user, signInWithGoogle, authFetch } = useAuth();
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3000';

  const [activeTab, setActiveTab] = useState<IntegrationTab>('vscode');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || 'algebraic-geometry-showcase',
  );
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    themes[0]?.id || 'anime',
  );
  const [selectedFormat, setSelectedFormat] = useState<'html' | 'pptx' | 'print'>('pptx');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [snippetStatus, setSnippetStatus] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [newKeyName, setNewKeyName] = useState<string>('Claude / Cursor');
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [mcpTab, setMcpTab] = useState<McpClientTab>('claude');

  const loadKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      return;
    }
    try {
      const res = await authFetch('/api/keys');
      if (res.ok) {
        const kd = await res.json();
        setApiKeys(kd.keys || []);
      }
    } catch {
      // Non-fatal load failure
    }
  }, [authFetch, user]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const copyText = async (key: string, value: string) => {
    await navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setKeyBusy(true);
    setKeyError(null);
    setNewlyCreatedSecret(null);
    try {
      const res = await authFetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() || 'Agent Key' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create API key');
      if (data.rawKey) {
        setNewlyCreatedSecret(data.rawKey);
      }
      await loadKeys();
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'API key creation failed');
    } finally {
      setKeyBusy(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    await authFetch(`/api/keys/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadKeys();
  };

  const mcpSnippet = useMemo(() => {
    const tokenPlaceholder = newlyCreatedSecret || 'pm_live_YOUR_API_KEY';
    if (mcpTab === 'claude') {
      return JSON.stringify(
        {
          mcpServers: {
            premarks: {
              command: 'npx',
              args: ['-y', '-p', `${origin}/api/integrations/cli/premarks-cli.tgz`, 'premarks-mcp'],
              env: {
                PREMARKS_URL: origin,
                PREMARKS_API_KEY: tokenPlaceholder,
              },
            },
          },
        },
        null,
        2,
      );
    }
    if (mcpTab === 'cursor') {
      return JSON.stringify(
        {
          mcpServers: {
            premarks: {
              url: `${origin}/mcp`,
              headers: {
                Authorization: `Bearer ${tokenPlaceholder}`,
              },
            },
          },
        },
        null,
        2,
      );
    }
    if (mcpTab === 'vscode') {
      return JSON.stringify(
        {
          servers: {
            premarks: {
              type: 'http',
              url: `${origin}/mcp`,
              headers: {
                Authorization: `Bearer ${tokenPlaceholder}`,
              },
            },
          },
        },
        null,
        2,
      );
    }
    return `PREMARKS_URL="${origin}" \\\nPREMARKS_API_KEY="${tokenPlaceholder}" \\\npremarks-mcp`;
  }, [mcpTab, newlyCreatedSecret, origin]);

  const npmInstallCmd = `npm install -g ${origin}/api/integrations/cli/premarks-cli.tgz`;
  const curlInstallCmd = `curl -fsSL ${origin}/api/integrations/cli/install.sh | bash`;
  const vsixInstallCmd = `code --install-extension premarks-vscode.vsix`;

  const cliWorkflowCmd = useMemo(() => {
    const outExt = selectedFormat === 'print' ? 'print.html' : selectedFormat;
    return [
      `premarks init ${selectedTemplateId} deck.md --theme ${selectedThemeId}`,
      `premarks lint deck.md`,
      `premarks dev deck.md`,
      `premarks build deck.md -f ${selectedFormat} -o deck.${outExt}`,
      `premarks share deck.md`,
    ].join('\n');
  }, [selectedFormat, selectedTemplateId, selectedThemeId]);

  const githubActionYaml = `name: Build Slides
on:
  push:
    paths: ['slides/**/*.md']
jobs:
  build-decks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g ${origin}/api/integrations/cli/premarks-cli.tgz
      - run: |
          premarks build slides/deck.md -f html -o dist/deck.html
          premarks build slides/deck.md -f pptx -o dist/deck.pptx
      - uses: actions/upload-artifact@v4
        with:
          name: compiled-presentations
          path: dist/`;

  const restApiCurl = `curl -X POST "${origin}/api/export-pptx" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${newlyCreatedSecret || 'pm_live_YOUR_API_KEY'}" \\
  -d '{"title":"Quarterly Review","themeId":"${selectedThemeId}","markdown":"# Slide 1\\n\\nBuilt via API"}' \\
  --output review.pptx`;

  const handleCopyVsCodeSnippets = async () => {
    try {
      const res = await fetch('/api/integrations/vscode/snippets');
      if (!res.ok) throw new Error('Could not load snippets');
      const text = await res.text();
      await copyText('vscode-snippets', text);
      setSnippetStatus('Snippets JSON copied.');
      setTimeout(() => setSnippetStatus(null), 2600);
    } catch {
      setSnippetStatus('Could not load snippets.');
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1160px] px-6 py-8 lg:px-10">
      <section className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end dark:border-neutral-800">
        <div>
          <h1 className="text-balance font-display text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Integrations
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
            Write and export presentations from VS Code, your terminal, AI assistants, or CI pipelines.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenStudio}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
        >
          Back to Studio
        </button>
      </section>

      {/* Clean 4-Tab Switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900">
        {(
          [
            { id: 'vscode', label: 'VS Code Extension', icon: Code2 },
            { id: 'cli', label: 'Terminal CLI', icon: Terminal },
            { id: 'mcp', label: 'AI Agents (MCP & API)', icon: Bot },
            { id: 'ci', label: 'GitHub Actions & REST', icon: Workflow },
          ] as { id: IntegrationTab; label: string; icon: typeof Code2 }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab 1: VS Code Extension */}
      {activeTab === 'vscode' && (
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
            Premarks for VS Code
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            Get a live 16:9 side-panel preview as you edit Markdown, lint slide density, insert layout blocks, and export to HTML, PowerPoint, or Print/PDF without leaving your editor.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="/api/integrations/vscode/premarks-vscode.vsix"
              download="premarks-vscode.vsix"
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 whitespace-nowrap shrink-0 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download Extension (.vsix)
            </a>

            <button
              type="button"
              onClick={handleCopyVsCodeSnippets}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy Markdown Snippets
            </button>
          </div>

          {snippetStatus && (
            <p className="mt-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {snippetStatus}
            </p>
          )}

          <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Install downloaded file from your terminal
              </span>
              <button
                type="button"
                onClick={() => copyText('vsix-cmd', vsixInstallCmd)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                {copiedKey === 'vsix-cmd' ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copiedKey === 'vsix-cmd' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="mt-2 overflow-x-auto font-mono text-xs text-neutral-800 dark:text-neutral-200">
              {vsixInstallCmd}
            </pre>
          </div>
        </section>
      )}

      {/* Tab 2: Terminal CLI */}
      {activeTab === 'cli' && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
              Install Premarks CLI
            </h2>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              Requires Node 18+. Includes both <code className="font-mono">premarks</code> and the local <code className="font-mono">premarks-mcp</code> command.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Install via npm
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('npm-cli', npmInstallCmd)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    {copiedKey === 'npm-cli' ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedKey === 'npm-cli' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-1.5 overflow-x-auto font-mono text-xs text-neutral-800 dark:text-neutral-200">
                  {npmInstallCmd}
                </pre>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Shell installer (macOS / Linux)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('curl-cli', curlInstallCmd)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    {copiedKey === 'curl-cli' ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedKey === 'curl-cli' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-1.5 overflow-x-auto font-mono text-xs text-neutral-800 dark:text-neutral-200">
                  {curlInstallCmd}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <a
                href="/api/integrations/cli/premarks-cli.tgz"
                download="premarks-cli.tgz"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-100 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download .tgz
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
              Quick Workflow Commands
            </h2>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              Pick a template, theme, and output format to copy ready commands.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                aria-label="CLI template"
                className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                aria-label="CLI theme"
                className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as 'html' | 'pptx' | 'print')}
                aria-label="CLI format"
                className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              >
                <option value="pptx">PowerPoint (.pptx)</option>
                <option value="html">Animated HTML</option>
                <option value="print">Print / PDF HTML</option>
              </select>
            </div>

            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Run in Terminal
                </span>
                <button
                  type="button"
                  onClick={() => copyText('cli-flow', cliWorkflowCmd)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  {copiedKey === 'cli-flow' ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedKey === 'cli-flow' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                {cliWorkflowCmd}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: AI Agents (MCP) & Personal API Keys */}
      {activeTab === 'mcp' && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-red-700 dark:text-red-400" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
                Step 1 · Create an Access Key
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              Use a personal key to connect Claude, Cursor, or scripts to your Premarks decks.
            </p>

            {!user ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <span className="text-xs text-neutral-700 dark:text-neutral-300">
                  Sign in with Google to create or revoke API keys.
                </span>
                <button
                  type="button"
                  onClick={() => signInWithGoogle().catch(() => {})}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  Sign in with Google
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleCreateKey} className="mt-4 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key label (e.g., Cursor)"
                    className="min-w-[180px] flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={keyBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 whitespace-nowrap shrink-0 dark:bg-white dark:text-neutral-950"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    New Key
                  </button>
                </form>

                {keyError && (
                  <p className="mt-2 text-xs text-red-700 dark:text-red-400">{keyError}</p>
                )}

                {newlyCreatedSecret && (
                  <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                        Copy key now (won&apos;t be shown again)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText('new-api-key', newlyCreatedSecret)}
                        className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-neutral-800 shadow-xs dark:bg-neutral-900 dark:text-neutral-200"
                      >
                        {copiedKey === 'new-api-key' ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedKey === 'new-api-key' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="mt-1.5 overflow-x-auto font-mono text-xs text-emerald-950 dark:text-emerald-200">
                      {newlyCreatedSecret}
                    </pre>
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
                        <th className="px-3 py-2 font-medium">Label</th>
                        <th className="px-3 py-2 font-medium">Prefix</th>
                        <th className="px-3 py-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {apiKeys.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-3 text-neutral-500 dark:text-neutral-400">
                            No keys created yet.
                          </td>
                        </tr>
                      ) : (
                        apiKeys.map((k) => (
                          <tr key={k.id}>
                            <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                              {k.name}
                            </td>
                            <td className="px-3 py-2 font-mono text-neutral-600 dark:text-neutral-300">
                              {k.keyPrefix}...
                            </td>
                            <td className="px-3 py-2 text-right">
                              {k.revokedAt ? (
                                <span className="text-neutral-400">Revoked</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeKey(k.id)}
                                  className="inline-flex items-center gap-1 text-red-700 hover:underline dark:text-red-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
              Step 2 · Connect Your AI Tool
            </h2>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              Let Claude, Cursor, or VS Code Copilot create, edit, check layout quality, and export decks via MCP.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
              {(
                [
                  { id: 'claude', label: 'Claude' },
                  { id: 'cursor', label: 'Cursor' },
                  { id: 'vscode', label: 'VS Code' },
                  { id: 'stdio', label: 'Local stdio' },
                ] as { id: McpClientTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMcpTab(tab.id)}
                  className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    mcpTab === tab.id
                      ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {mcpTab === 'claude' && 'claude_desktop_config.json'}
                  {mcpTab === 'cursor' && '.cursor/mcp.json'}
                  {mcpTab === 'vscode' && '.vscode/mcp.json'}
                  {mcpTab === 'stdio' && 'Terminal Command'}
                </span>
                <button
                  type="button"
                  onClick={() => copyText('mcp-snippet', mcpSnippet)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  {copiedKey === 'mcp-snippet' ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedKey === 'mcp-snippet' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mt-2 max-h-52 overflow-auto font-mono text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {mcpSnippet}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* Tab 4: GitHub Actions & REST API */}
      {activeTab === 'ci' && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
              GitHub Actions Auto-Build
            </h2>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              Compile Markdown slide files into HTML and PowerPoint automatically on every push.
            </p>

            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  .github/workflows/slides.yml
                </span>
                <button
                  type="button"
                  onClick={() => copyText('gh-action', githubActionYaml)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  {copiedKey === 'gh-action' ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedKey === 'gh-action' ? 'Copied' : 'Copy YAML'}
                </button>
              </div>
              <pre className="mt-2 max-h-56 overflow-auto font-mono text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {githubActionYaml}
              </pre>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
              Direct HTTP Export API
            </h2>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              Generate `.pptx`, `.html`, or `.pdf` files from any backend script or automation workflow.
            </p>

            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  cURL Example
                </span>
                <button
                  type="button"
                  onClick={() => copyText('curl-api', restApiCurl)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  {copiedKey === 'curl-api' ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedKey === 'curl-api' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {restApiCurl}
              </pre>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
