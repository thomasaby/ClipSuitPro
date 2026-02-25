import Dexie, { type Table } from 'dexie'

export const MAX_SNIPPETS = 20

export interface Snippet {
  id?: number
  content: string
  language: string
  timestamp: number
  tags: string[]
}

class ClipSuitDB extends Dexie {
  snippets!: Table<Snippet, number>

  constructor() {
    super('ClipSuitDB')
    this.version(1).stores({
      snippets: '++id, content, language, timestamp, tags',
    })
  }
}

export const db = new ClipSuitDB()