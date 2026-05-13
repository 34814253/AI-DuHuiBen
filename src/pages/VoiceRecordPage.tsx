import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const MIN_SEC = 5
const MAX_SEC = 15

function pickRecorderMime(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return undefined
}

export function VoiceRecordPage() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<'idle' | 'recording' | 'review'>('idle')
  const [durationSec, setDurationSec] = useState(0)
  const [waveBars, setWaveBars] = useState<number[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [micDenied, setMicDenied] = useState(false)
  const [noRecorder, setNoRecorder] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const maxTimerRef = useRef<number | null>(null)
  const recordStartRef = useRef(0)
  const recordingActiveRef = useRef(false)
  const durationStopRef = useRef(0)

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => {
      t.stop()
    })
    streamRef.current = null
  }, [])

  const stopWaveLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    recordingActiveRef.current = false
    setWaveBars([])
  }, [])

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (maxTimerRef.current !== null) {
      window.clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof MediaRecorder === 'undefined') {
      setNoRecorder(true)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimers()
      stopWaveLoop()
      cleanupStream()
      void audioContextRef.current?.close()
      mediaRecorderRef.current = null
    }
  }, [cleanupStream, clearTimers, stopWaveLoop])

  const stopRecording = useCallback(() => {
    if (!recordingActiveRef.current) return
    clearTimers()
    stopWaveLoop()
    durationStopRef.current = (Date.now() - recordStartRef.current) / 1000
    setDurationSec(durationStopRef.current)

    const rec = mediaRecorderRef.current
    if (rec && rec.state !== 'inactive') {
      rec.stop()
    } else {
      cleanupStream()
      void audioContextRef.current?.close()
      audioContextRef.current = null
      setPhase('idle')
    }
  }, [cleanupStream, clearTimers, stopWaveLoop])

  const startRecording = useCallback(async () => {
    if (noRecorder || micDenied) return
    setToast(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      const mimeType = pickRecorderMime()
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = rec
      chunksRef.current = []

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || mimeType || 'audio/webm',
        })
        cleanupStream()
        void audioContextRef.current?.close()
        audioContextRef.current = null
        analyserRef.current = null
        mediaRecorderRef.current = null

        setRecordedBlob(blob)
        setPhase('review')
      }

      rec.start(120)

      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      audioContextRef.current = ctx
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser

      recordStartRef.current = Date.now()
      recordingActiveRef.current = true
      setDurationSec(0)
      setPhase('recording')

      timerRef.current = window.setInterval(() => {
        const sec = (Date.now() - recordStartRef.current) / 1000
        setDurationSec(sec)
      }, 120)

      maxTimerRef.current = window.setTimeout(() => {
        stopRecording()
      }, MAX_SEC * 1000)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!recordingActiveRef.current || !analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const bars = Array.from(dataArray.slice(0, 28)).map((v) => Math.min(1, v / 220))
        setWaveBars(bars)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setMicDenied(true)
      cleanupStream()
    }
  }, [cleanupStream, micDenied, noRecorder, stopRecording])

  const onMicPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    if (phase !== 'idle' || noRecorder) return
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* 忽略 */
    }
    void startRecording()
  }

  const onMicPointerUp = (e: React.PointerEvent) => {
    e.preventDefault()
    if (phase !== 'recording') return
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* 忽略 */
    }
    stopRecording()
  }

  const resetTake = () => {
    setRecordedBlob(null)
    setDurationSec(0)
    durationStopRef.current = 0
    setPhase('idle')
    setToast(null)
  }

  const submitComplete = () => {
    if (!recordedBlob) return
    const sec = durationStopRef.current || durationSec
    if (sec < MIN_SEC) {
      setToast(`录音需至少 ${MIN_SEC} 秒，当前 ${sec.toFixed(1)} 秒`)
      return
    }
    navigate('/voice-success', { state: { blob: recordedBlob } })
  }

  const fmt = (s: number) => {
    const n = Math.min(MAX_SEC, Math.max(0, s))
    return n.toFixed(1)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FFF8E7] px-[20px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] text-[#2C3E50]">
      <header className="mb-[16px] flex items-center justify-between">
        <Link
          to="/"
          className="rounded-[12px] bg-white px-[14px] py-[10px] text-[22px] font-semibold shadow-[0_4px_0_rgba(44,62,80,0.06)]"
        >
          ✕
        </Link>
        <h1 className="text-[26px] font-bold">录制音色</h1>
        <span className="w-[44px]" />
      </header>

      {toast ? (
        <div className="mb-[12px] rounded-[14px] bg-[#FFF3CD] px-[16px] py-[12px] text-center text-[22px] text-[#856404]">
          {toast}
        </div>
      ) : null}

      {noRecorder ? (
        <p className="mb-[16px] text-center text-[22px] text-[#B45309]">
          当前环境不支持 MediaRecorder，请使用 Chrome / Safari 最新版
        </p>
      ) : null}

      {micDenied ? (
        <div className="mb-[16px] rounded-[16px] bg-white px-[16px] py-[20px] text-center shadow-md">
          <p className="text-[24px] font-semibold">需要麦克风权限</p>
          <button
            type="button"
            className="mt-[12px] rounded-full bg-[#FF9F3A] px-[24px] py-[12px] text-[22px] font-bold text-white"
            onClick={() => setMicDenied(false)}
          >
            知道了，再试一次
          </button>
        </div>
      ) : null}

      <div className="mb-[20px] rounded-[24px] bg-white px-[18px] py-[22px] shadow-[0_8px_0_rgba(232,137,46,0.15)]">
        <p className="text-center text-[24px] font-semibold leading-snug">
          请大声朗读下面这段话：
        </p>
        <p className="mt-[14px] text-center text-[22px] leading-relaxed text-[#4B5563]">
          「小兔子蹦蹦跳跳地来到森林里，遇见了好朋友小松鼠。」
        </p>
      </div>

      <div className="mb-[12px] flex min-h-[72px] items-end justify-center gap-[4px] rounded-[16px] bg-[#2C3E50]/[0.06] px-[10px] py-[14px]">
        {phase === 'recording' && waveBars.length > 0
          ? waveBars.map((h, i) => (
              <span
                key={i}
                className="w-[6px] rounded-full bg-[#FF9F3A]"
                style={{ height: `${12 + h * 48}px` }}
              />
            ))
          : Array.from({ length: 28 }).map((_, i) => (
              <span key={i} className="h-[10px] w-[6px] rounded-full bg-[#E5E7EB]" />
            ))}
      </div>

      <p className="mb-[24px] text-center text-[24px] font-semibold tabular-nums text-[#2C3E50]">
        已录制 {fmt(durationSec)}s / {MAX_SEC}s
      </p>

      <div className="flex flex-col items-center gap-[24px]">
        <button
          type="button"
          className={`relative flex h-[120px] w-[120px] touch-none items-center justify-center rounded-full bg-gradient-to-br from-[#FF9F3A] to-[#FF7BA3] text-[52px] shadow-[0_10px_0_#E8892E] transition-transform select-none ${phase === 'recording' ? 'translate-y-[4px] shadow-[0_6px_0_#E8892E]' : 'active:translate-y-[4px]'}`}
          style={{ touchAction: 'none' }}
          aria-label="按住录音"
          disabled={phase === 'review' || noRecorder || !!micDenied}
          onPointerDown={onMicPointerDown}
          onPointerUp={onMicPointerUp}
          onPointerCancel={onMicPointerUp}
        >
          🎤
        </button>
        <p className="text-center text-[22px] text-[#6B7280]">
          {phase === 'idle' && '按住麦克风开始录音'}
          {phase === 'recording' && '松开结束（最长 15 秒）'}
          {phase === 'review' && '试听与提交请在下一步完成'}
        </p>
      </div>

      {phase === 'review' ? (
        <div className="mt-auto flex flex-col gap-[14px] pt-[28px]">
          <button
            type="button"
            onClick={resetTake}
            className="rounded-full border-2 border-[#FF9F3A] bg-white py-[16px] text-[26px] font-bold text-[#FF9F3A]"
          >
            重新录制
          </button>
          <button
            type="button"
            onClick={submitComplete}
            className="rounded-full bg-[#FF9F3A] py-[16px] text-[26px] font-bold text-white shadow-[0_8px_0_#E8892E]"
          >
            完成 ✓
          </button>
        </div>
      ) : null}

      <p className="mt-[20px] text-center text-[20px] leading-relaxed text-[#9CA3AF]">
        松开或录满 {MAX_SEC} 秒会自动停止；点「完成」需不少于 {MIN_SEC} 秒。
      </p>
    </div>
  )
}
