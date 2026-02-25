import { db, MAX_SNIPPETS } from './db'

const MENU_ID = 'clipsuit-save'
const SAVE_FROM_COPY_MESSAGE = 'SAVE_SNIPPET_FROM_COPY'

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

async function saveSnippet(content: string): Promise<void> {
  const normalizedContent = content.trim()
  if (!normalizedContent) {
    return
  }

  const snippetCount = await db.snippets.count()
  if (snippetCount >= MAX_SNIPPETS) {
    return
  }

  await db.snippets.add({
    content: normalizedContent,
    language: 'plaintext',
    timestamp: Date.now(),
    tags: [],
  })
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

  await saveSnippet(content)
})

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('type' in message) ||
    !('payload' in message)
  ) {
    return
  }

  const typedMessage = message as { type?: string; payload?: string }

  if (typedMessage.type !== SAVE_FROM_COPY_MESSAGE || typeof typedMessage.payload !== 'string') {
    return
  }

  void saveSnippet(typedMessage.payload)
})