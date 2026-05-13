import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { BookItem } from '../types/book'
import { upsertBook } from '../lib/bookStorage'

const CONFETTI_COLORS = ['#FF9F3A', '#7ED957', '#60A5FA', '#F472B6', '#FACC15', '#A78BFA', '#38BDF8']

type ConfettiPiece = {
  id: number
  leftPct: number
  delaySec: number
  durationSec: number
  widthPx: number
  heightPx: number
  driftPx: number
  spinDeg: number
  color: string
}

function ScanResultConfetti() {
  const pieces = useMemo((): ConfettiPiece[] => {
    const count = 48
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      leftPct: Math.random() * 100,
      delaySec: Math.random() * 0.45,
      durationSec: 2.4 + Math.random() * 1.6,
      widthPx: 5 + Math.floor(Math.random() * 5),
      heightPx: 7 + Math.floor(Math.random() * 8),
      driftPx: (Math.random() - 0.5) * 100,
      spinDeg: 360 + Math.floor(Math.random() * 540),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    }))
  }, [])

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[100] overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="scan-result-confetti-piece"
          style={{
            left: `${p.leftPct}%`,
            width: p.widthPx,
            height: p.heightPx,
            backgroundColor: p.color,
            boxShadow: '0 0 1px rgba(255,255,255,0.35)',
            animationDuration: `${p.durationSec}s`,
            animationDelay: `${p.delaySec}s`,
            ['--zh-drift' as string]: `${p.driftPx}px`,
            ['--zh-spin' as string]: `${p.spinDeg}deg`,
          }}
        />
      ))}
    </div>
  )
}

export function ScanResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { book?: BookItem } | undefined

  useEffect(() => {
    if (!state?.book) {
      navigate('/', { replace: true })
      return
    }
    upsertBook(state.book)
  }, [navigate, state?.book])

  if (!state?.book) {
    return (
      <div className="flex h-full min-h-full items-center justify-center bg-[#FFF8E7]">
        <p className="text-[22px] text-[#6B7280]">跳转中…</p>
      </div>
    )
  }

  const b = state.book

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#FFF8E7] px-[24px] pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))] text-[#2C3E50]">
      <header className="relative mb-[24px] flex justify-start">
        <Link
          to="/"
          className="rounded-[12px] bg-white px-[14px] py-[10px] text-[22px] font-semibold shadow-[0_4px_0_rgba(44,62,80,0.08)]"
        >
          ✕
        </Link>
      </header>

      <div className="relative flex flex-1 flex-col items-center text-center">
        <p className="mb-[8px] text-[28px] font-bold text-[#FF9F3A]">找到啦！</p>

        <div className="book-pop mb-[28px] mt-[12px] flex h-[180px] w-[140px] items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-[#FFE566] via-[#FF9F3A] to-[#FF7BA3] shadow-[0_12px_0_rgba(232,137,46,0.35),0_16px_32px_rgba(44,62,80,0.15)]">
          {b.coverUrl ? (
            <img src={b.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[64px]" aria-hidden>
              📖
            </span>
          )}
        </div>

        <h1 className="mb-[8px] text-[32px] font-bold leading-tight">{b.title}</h1>
        <p className="mb-[24px] text-[24px] text-[#6B7280]">{b.author}</p>
        <p className="mb-[40px] flex items-center justify-center gap-[8px] text-[24px] font-medium text-[#7ED957]">
          <span aria-hidden>✓</span> 已加入书架
        </p>

        <button
          type="button"
          onClick={() => navigate(`/read/${encodeURIComponent(b.id)}`)}
          className="w-full max-w-[320px] rounded-full bg-[#FF9F3A] py-[18px] text-[28px] font-bold text-white shadow-[0_8px_0_#E8892E] active:translate-y-[3px] active:shadow-[0_4px_0_#E8892E]"
        >
          马上开始读
        </button>
      </div>

      <ScanResultConfetti />
    </div>
  )
}
