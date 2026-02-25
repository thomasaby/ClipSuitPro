import { useEffect, useMemo, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { db, MAX_SNIPPETS, type Snippet } from './db'

function App() {
  const [query, setQuery] = useState('')
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [recentlyDeleted, setRecentlyDeleted] = useState<Snippet | null>(null)
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('Snippet deleted')
  const undoTimeoutRef = useRef<number | null>(null)

  async function loadSnippets() {
    const data = await db.snippets.orderBy('timestamp').reverse().toArray()
    setSnippets(data)
  }

  useEffect(() => {
    void loadSnippets()
  }, [])

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current !== null) {
        window.clearTimeout(undoTimeoutRef.current)
      }
    }
  }, [])

  const filteredSnippets = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase()

    if (!lowerQuery) {
      return snippets
    }

    return snippets.filter((snippet) => {
      const contentMatch = snippet.content.toLowerCase().includes(lowerQuery)
      const languageMatch = snippet.language.toLowerCase().includes(lowerQuery)
      return contentMatch || languageMatch
    })
  }, [query, snippets])

  async function handleCopy(content: string) {
    await navigator.clipboard.writeText(content)
  }

  function startUndoCountdown() {
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
    }

    undoTimeoutRef.current = window.setTimeout(() => {
      setShowUndoSnackbar(false)
      setRecentlyDeleted(null)
      undoTimeoutRef.current = null
    }, 5000)
  }

  function startMessageCountdown() {
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
    }

    undoTimeoutRef.current = window.setTimeout(() => {
      setShowUndoSnackbar(false)
      undoTimeoutRef.current = null
    }, 5000)
  }

  async function handleDelete(snippet: Snippet) {
    if (!snippet.id) {
      return
    }

    await db.snippets.delete(snippet.id)
    setRecentlyDeleted(snippet)
    setSnackbarMessage('Snippet deleted')
    setShowUndoSnackbar(true)
    startUndoCountdown()
    await loadSnippets()
  }

  async function handleUndoDelete() {
    if (!recentlyDeleted) {
      return
    }

    const snippetCount = await db.snippets.count()
    if (snippetCount >= MAX_SNIPPETS) {
      setRecentlyDeleted(null)
      setSnackbarMessage('Undo failed: snippet limit reached (20/20).')
      setShowUndoSnackbar(true)
      startMessageCountdown()
      return
    }

    const { id: _id, ...snippetData } = recentlyDeleted
    await db.snippets.add(snippetData)

    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }

    setShowUndoSnackbar(false)
    setRecentlyDeleted(null)
    await loadSnippets()
  }

  function toTitleCase(value: string): string {
    if (!value) {
      return 'Plaintext'
    }

    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString()
  }

  function twoLinePreview(content: string): string {
    return content.split('\n').slice(0, 2).join('\n')
  }

  const isLimitReached = snippets.length >= MAX_SNIPPETS

  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
      <header className="border-b border-slate-700 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">ClipSuit</h1>
          <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
            {snippets.length}/{MAX_SNIPPETS}
          </span>
        </div>
        {isLimitReached && (
          <p className="mb-3 rounded-md border border-amber-700 bg-amber-900/20 px-2 py-1 text-xs text-amber-300">
            Warning: snippet limit reached (20/20). Delete one to save another.
          </p>
        )}
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search snippets"
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
        />
      </header>

      <section className="flex-1 space-y-3 overflow-y-auto p-4">
        {filteredSnippets.map((snippet) => (
          <article
            key={snippet.id}
            className="rounded-lg border border-slate-700 bg-slate-800/80 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200">
                {toTitleCase(snippet.language)}
              </span>
              <time className="text-xs text-slate-400">{formatDate(snippet.timestamp)}</time>
            </div>

            <div className="mb-3 overflow-hidden rounded border border-slate-700">
              <SyntaxHighlighter
                language={snippet.language || 'text'}
                style={oneDark}
                customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem' }}
                wrapLongLines
                showLineNumbers={false}
              >
                {twoLinePreview(snippet.content)}
              </SyntaxHighlighter>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => void handleCopy(snippet.content)}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(snippet)}
                className="rounded-md border border-rose-700 px-2 py-1 text-xs text-rose-300 hover:bg-rose-900/30"
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {filteredSnippets.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
            No snippets yet. Use "Save to ClipSuit" from the page context menu.
          </div>
        )}
      </section>

      {showUndoSnackbar && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 shadow-lg">
          <span className="text-xs text-slate-200">{snackbarMessage}</span>
          {recentlyDeleted && (
            <button
              type="button"
              onClick={() => void handleUndoDelete()}
              className="rounded-md border border-cyan-700 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-900/30"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </main>
  )
}

export default App
