import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import ruby from 'highlight.js/lib/languages/ruby'
import php from 'highlight.js/lib/languages/php'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import { db, MAX_SNIPPETS } from './db'

const MENU_ID = 'clipsuit-save'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('php', php)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('markdown', markdown)

const languageAliases: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  cs: 'csharp',
  sh: 'bash',
  html: 'xml',
}

function normalizeLanguage(language?: string): string {
  if (!language) {
    return 'plaintext'
  }

  const normalized = language.toLowerCase()
  return languageAliases[normalized] ?? normalized
}

function detectLanguage(content: string): string {
  try {
    const detected = hljs.highlightAuto(content)
    return normalizeLanguage(detected.language)
  } catch {
    return 'plaintext'
  }
}

async function readClipboardText(): Promise<string> {
  if (!navigator?.clipboard?.readText) {
    return ''
  }

  try {
    return (await navigator.clipboard.readText()).trim()
  } catch {
    return ''
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.remove(MENU_ID, () => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Save to ClipSuit',
      contexts: ['selection', 'editable', 'page'],
    })
  })
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) {
    return
  }

  const selectedText = info.selectionText?.trim() ?? ''
  const clipboardText = selectedText ? '' : await readClipboardText()
  const content = (selectedText || clipboardText).trim()

  if (!content) {
    return
  }

  const snippetCount = await db.snippets.count()
  if (snippetCount >= MAX_SNIPPETS) {
    return
  }

  await db.snippets.add({
    content,
    language: detectLanguage(content),
    timestamp: Date.now(),
    tags: [],
  })
})