import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { playBeep } from '../audio/playBeep'

/** P5 实时识别朗读：仅音频与画面反馈，不展示识别文案（PRD） */
export function LiveReadPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [permissionDenied, setPermissionDenied] = useState(false)
  const [pulse, setPulse] = useState(false)

  const stopStream = useCallback(() => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((t) => {
        t.stop()
      })
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setPermissionDenied(false)
    stopStream()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      const el = videoRef.current
      if (el) {
        el.srcObject = stream
        await el.play()
      }
    } catch {
      setPermissionDenied(true)
    }
  }, [stopStream])

  useEffect(() => {
    startCamera()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      stopStream()
    }
  }, [startCamera, stopStream])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPulse(true)
      playBeep()
      window.setTimeout(() => setPulse(false), 600)
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f172a] text-white">
      <header className="flex shrink-0 items-center justify-between px-[16px] pb-[12px] pt-[calc(12px+env(safe-area-inset-top))]">
        <Link
          to="/"
          className="rounded-[12px] bg-white/10 px-[14px] py-[10px] text-[22px] font-semibold"
        >
          ✕
        </Link>
        <span className="flex items-center gap-[8px] text-[22px] font-semibold text-[#7ED957]">
          <span className="relative flex h-[10px] w-[10px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7ED957] opacity-60" />
            <span className="relative inline-flex h-[10px] w-[10px] rounded-full bg-[#7ED957]" />
          </span>
          聆听中
        </span>
        <span className="w-[48px]" />
      </header>

      <div className="relative min-h-0 flex-1 bg-black">
        {permissionDenied ? (
          <div className="flex h-full flex-col items-center justify-center gap-[16px] px-[24px] text-center">
            <p className="text-[24px]">无法打开摄像头</p>
            <button
              type="button"
              onClick={() => startCamera()}
              className="rounded-full bg-[#FF9F3A] px-[24px] py-[12px] text-[22px] font-bold"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <div
              className={`pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_55%,rgba(126,217,87,0.15)_75%,transparent_85%)] transition-opacity duration-300 ${pulse ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="pointer-events-none absolute bottom-[22%] left-[50%] z-[3] flex -translate-x-[50%] items-center justify-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[4px] border-[#7ED957]/80 bg-black/25 text-[36px] shadow-[0_0_24px_rgba(126,217,87,0.5)]">
                📖
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-black/40 px-[20px] py-[16px] pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-[16px]">
          <div className="flex items-center gap-[10px] text-[22px] text-white/85">
            <span aria-hidden>🔊</span>
            <span>播放中</span>
          </div>
          <button
            type="button"
            className="rounded-full bg-white/15 px-[20px] py-[10px] text-[22px] font-semibold text-white/95"
          >
            音色
          </button>
        </div>
      </footer>
    </div>
  )
}
