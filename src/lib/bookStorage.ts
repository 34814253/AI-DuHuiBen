import type { BookItem } from '../types/book'

const STORAGE_KEY = 'zhihuiben_books_v1'

function safeParse(raw: string | null): BookItem[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter(
      (item): item is BookItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as BookItem).id === 'string' &&
        typeof (item as BookItem).title === 'string',
    )
  } catch {
    return []
  }
}

export function loadBooks(): BookItem[] {
  return safeParse(localStorage.getItem(STORAGE_KEY))
}

export function saveBooks(books: BookItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

/** 写入或替换同 id 的书本（用于识别后加入书架） */
export function upsertBook(book: BookItem): void {
  const books = loadBooks()
  const idx = books.findIndex((b) => b.id === book.id)
  if (idx >= 0) {
    books[idx] = book
  } else {
    books.unshift(book)
  }
  saveBooks(books)
}

export function loadBookById(id: string): BookItem | undefined {
  return loadBooks().find((b) => b.id === id)
}

