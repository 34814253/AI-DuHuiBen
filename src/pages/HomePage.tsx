import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BottomTabBar } from '../components/BottomTabBar'
import { loadBooks } from '../lib/bookStorage'
import { loadVoices } from '../lib/voiceListStorage'
import type { BookItem } from '../types/book'

/** Figma node 4304:1425 — 首页切图（由 MCP 导出至 public/home-figma） */
const FIG = {
  bg: '/home-figma/bg.png',
  shelfBar: '/home-figma/shelf-bar.png',
  bookPlaceholder: '/home-figma/book-cover-placeholder.png',
} as const

function chunkPairs<T>(arr: T[]): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += 2) rows.push(arr.slice(i, i + 2))
  return rows
}

function BookColumn({ book }: { book: BookItem }) {
  const cover = book.coverUrl ?? FIG.bookPlaceholder
  return (
    <div className="relative flex w-[98px] shrink-0 flex-col items-center gap-[4px]">
      <Link
        to={`/read/${encodeURIComponent(book.id)}`}
        className="relative block h-[120px] w-[90px] shrink-0 overflow-hidden rounded-[4px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
      >
        <img src={cover} alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover" />
      </Link>
      <p
        className="w-full min-w-0 shrink-0 overflow-hidden text-center font-['PingFang_SC',sans-serif] text-[14px] font-normal not-italic leading-normal text-white text-ellipsis whitespace-nowrap"
        title={book.title}
      >
        {book.title}
      </p>
    </div>
  )
}

function EmptySecondColumn() {
  return (
    <div className="flex w-[98px] shrink-0 flex-col items-center gap-[4px] opacity-0" aria-hidden>
      <div className="h-[120px] w-[90px] shrink-0 rounded-[4px]" />
      <p className="text-[14px] text-white">&nbsp;</p>
    </div>
  )
}

function ShelfRow({ pair }: { pair: BookItem[] }) {
  const left = pair[0]!
  const right = pair[1]
  return (
    <div className="relative flex w-full shrink-0 flex-col items-center">
      <div className="pointer-events-none absolute left-0 top-[93px] h-[80px] w-[337px]">
        <img alt="" className="absolute inset-0 size-full max-w-none object-cover" src={FIG.shelfBar} />
      </div>
      <div className="relative flex shrink-0 items-center gap-[64px]">
        <BookColumn book={left} />
        {right ? <BookColumn book={right} /> : <EmptySecondColumn />}
      </div>
    </div>
  )
}

function EmptyShelf() {
  return (
    <div className="flex flex-col items-center px-[16px] pb-[80px] pt-[32px] text-center">
      <p className="max-w-[280px] font-['PingFang_SC',sans-serif] text-[16px] font-medium leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        扫一本绘本开始吧~
      </p>
    </div>
  )
}

export function HomePage() {
  const location = useLocation()
  const books = useMemo(() => loadBooks(), [location.key])
  const voiceCount = useMemo(() => loadVoices().length, [location.key])

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-white font-sans text-[#2C3E50]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[667px] w-[375px] max-w-full -translate-x-1/2">
        <img alt="" className="size-full max-w-none object-cover object-top" src={FIG.bg} />
      </div>

      {voiceCount > 0 ? (
        <p
          className="absolute right-[12px] top-[calc(8px+env(safe-area-inset-top))] z-20 rounded-full bg-black/20 px-[10px] py-[3px] text-[11px] text-white backdrop-blur-[6px]"
          aria-live="polite"
        >
          已保存音色 {voiceCount} 个
        </p>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(99px+env(safe-area-inset-bottom))] pt-[60px]">
          {books.length === 0 ? (
            <div className="mx-auto flex w-[337px] flex-col">
              <EmptyShelf />
            </div>
          ) : (
            <div className="mx-auto flex w-[337px] flex-col gap-[20px]">
              {chunkPairs(books).map((pair, idx) => (
                <ShelfRow key={`${pair[0]!.id}-${pair[1]?.id ?? 'x'}-${idx}`} pair={pair} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomTabBar />
    </div>
  )
}
