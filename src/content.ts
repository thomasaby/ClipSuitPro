const SAVE_FROM_COPY_MESSAGE = 'SAVE_SNIPPET_FROM_COPY'

let lastCopiedValue = ''
let lastCopiedAt = 0

function shouldIgnoreCopy(value: string): boolean {
  const now = Date.now()
  const normalizedValue = value.trim()
  const isDuplicate =
    normalizedValue === lastCopiedValue && now - lastCopiedAt < 1500

  if (isDuplicate) {
    return true
  }

  lastCopiedValue = normalizedValue
  lastCopiedAt = now
  return false
}

document.addEventListener('copy', (event) => {
  const selectedText = window.getSelection()?.toString().trim() ?? ''
  const clipboardText = event.clipboardData?.getData('text/plain')?.trim() ?? ''
  const content = selectedText || clipboardText

  if (!content || shouldIgnoreCopy(content)) {
    return
  }

  chrome.runtime.sendMessage({
    type: SAVE_FROM_COPY_MESSAGE,
    payload: content,
  })
})
