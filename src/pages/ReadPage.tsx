import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { LOGICAL_STAGE_H, LOGICAL_STAGE_W } from '../constants/stage'
import { getPagesForBook } from '../mock/bookPages'
import { loadBookById } from '../lib/bookStorage'
import { loadVoices } from '../lib/voiceListStorage'

const PRESET_VOICES = [
  { id: 'preset-1', name: '温柔姐姐' },
  { id: 'preset-2', name: '活力哥哥' },
  { id: 'preset-3', name: '智慧爷爷' },
]

/** Figma 4291:831 画布；切图由 MCP 拉取至 public/read-page-figma */
const DESIGN_W = 667
const DESIGN_H = 375

const FIGMA = {
  bg: '/read-page-figma/bg.png',
  bookSpread: '/read-page-figma/book-spread.png',
  back: '/read-page-figma/back-button.png',
  tabShell: '/read-page-figma/tab-shell.svg',
  iconMusic: '/read-page-figma/icon-music.svg',
  checkRing: '/read-page-figma/check-ring.svg',
  checkMark: '/read-page-figma/check-mark.svg',
  iconVoice: '/read-page-figma/icon-voice.svg',
} as const

type VoiceOption = { id: string; name: string; kind: 'preset' | 'cloned' }

function useFitReadFrame(designW: number, designH: number) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const pad = 0 // 移除 padding，让内容完全填满
    const update = () => {
      const isLandscape = window.innerWidth > window.innerHeight
      const stageW = isLandscape ? LOGICAL_STAGE_H : LOGICAL_STAGE_W // 横屏用 667，竖屏用 375
      const stageH = isLandscape ? LOGICAL_STAGE_W : LOGICAL_STAGE_H // 横屏用 375，竖屏用 667
      const sw = (stageW - pad * 2) / designW
      const sh = (stageH - pad * 2) / designH
      setScale(Math.max(0.42, Math.min(sw, sh, 1.35)))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [designW, designH])
  return scale
}

export function ReadPage() {
  const location = useLocation()
  const rawId = useParams().bookId ?? ''
  const bookId = useMemo(() => decodeURIComponent(rawId), [rawId])

  const book = useMemo(() => loadBookById(bookId), [bookId])
  const pages = useMemo(() => (book ? getPagesForBook(book) : []), [book])

  const [pageIndex, setPageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [bgmOn, setBgmOn] = useState(true)
  const [selectedVoiceId, setSelectedVoiceId] = useState(PRESET_VOICES[0].id)
  const [voicePanelOpen, setVoicePanelOpen] = useState(false)
  const [showRotateTip, setShowRotateTip] = useState(false)

  const scale = useFitReadFrame(DESIGN_W, DESIGN_H)

  const voiceOptions: VoiceOption[] = useMemo(() => {
    const presets: VoiceOption[] = PRESET_VOICES.map((v) => ({
      id: v.id,
      name: v.name,
      kind: 'preset',
    }))
    const cloned: VoiceOption[] = loadVoices().map((v) => ({
      id: v.id,
      name: v.name,
      kind: 'cloned',
    }))
    return [...presets, ...cloned]
  }, [voicePanelOpen, location.key])

  const currentVoiceName = useMemo(() => {
    return voiceOptions.find((v) => v.id === selectedVoiceId)?.name ?? PRESET_VOICES[0].name
  }, [voiceOptions, selectedVoiceId])

  useEffect(() => {
    const ids = new Set(voiceOptions.map((v) => v.id))
    if (!ids.has(selectedVoiceId)) {
      setSelectedVoiceId(PRESET_VOICES[0].id)
    }
  }, [voiceOptions, selectedVoiceId])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const bgmOnRef = useRef(bgmOn)
  const simTimerRef = useRef<number | null>(null)

  bgmOnRef.current = bgmOn

  const currentPage = pages[pageIndex]

  const clearSimTimer = useCallback(() => {
    if (simTimerRef.current !== null) {
      window.clearTimeout(simTimerRef.current)
      simTimerRef.current = null
    }
  }, [])

  const handleTrackEnded = useCallback(() => {
    let didLoopBook = false
    setPageIndex((i) => {
      if (i >= pages.length - 1) {
        didLoopBook = true
        return 0
      }
      return i + 1
    })
    if (didLoopBook) {
      setIsPlaying(true)
      const bgm = bgmRef.current
      if (bgm) {
        bgm.pause()
        bgm.currentTime = 0
        if (bgmOnRef.current) void bgm.play().catch(() => {})
      }
    }
  }, [pages.length])

  useEffect(() => {
    const update = () => {
      setShowRotateTip(window.innerWidth < window.innerHeight)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  useEffect(() => {
    const el = bgmRef.current
    if (!el) return
    el.loop = true
    el.volume = 0.28
    if (bgmOn) {
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [bgmOn])

  useEffect(() => {
    const el = audioRef.current
    if (!el || !currentPage) return

    clearSimTimer()
    el.pause()
    el.onended = null
    el.onerror = null

    if (currentPage.audioUrl) {
      el.src = currentPage.audioUrl
      el.load()
      el.onended = () => handleTrackEnded()
      el.onerror = () => {
        clearSimTimer()
        simTimerRef.current = window.setTimeout(() => {
          handleTrackEnded()
        }, currentPage.durationSec * 1000)
      }
    } else {
      el.removeAttribute('src')
      el.load()
    }

    return () => {
      clearSimTimer()
    }
  }, [clearSimTimer, currentPage, handleTrackEnded, pageIndex])

  useEffect(() => {
    const el = audioRef.current
    if (!currentPage) return

    clearSimTimer()

    if (currentPage.audioUrl && el) {
      if (isPlaying) {
        void el.play().catch(() => {
          simTimerRef.current = window.setTimeout(() => {
            handleTrackEnded()
          }, currentPage.durationSec * 1000)
        })
      } else {
        el.pause()
      }
      return () => {
        clearSimTimer()
      }
    }

    if (!currentPage.audioUrl && isPlaying) {
      simTimerRef.current = window.setTimeout(() => {
        handleTrackEnded()
      }, currentPage.durationSec * 1000)
    }

    return () => {
      clearSimTimer()
    }
  }, [clearSimTimer, currentPage, handleTrackEnded, isPlaying, pageIndex])

  const togglePlay = () => setIsPlaying((p) => !p)

  const goPrev = () => {
    setPageIndex((i) => Math.max(0, i - 1))
  }

  const goNext = () => {
    setPageIndex((i) => Math.min(pages.length - 1, i + 1))
  }

  const presetChoices = voiceOptions.filter((v) => v.kind === 'preset')
  const clonedChoices = voiceOptions.filter((v) => v.kind === 'cloned')

  if (!book || pages.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex h-full min-h-0 flex-col items-center justify-center gap-[16px] bg-[#2a1f18] px-[24px] text-white">
        <p className="text-[26px]">未找到绘本</p>
        <Link to="/" className="text-[24px] font-semibold text-[#ffdb4d]">
          回书架
        </Link>
      </div>
    )
  }

  const title = book.title
  const titleWithProgress = `${title}(${pageIndex + 1}/${pages.length})`
  const pageImageSrc = currentPage?.imageUrl || FIGMA.bookSpread

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black">
      <audio ref={audioRef} preload="none" />
      <audio ref={bgmRef} src="/mock-audio/bgm.mp3" preload="none" />

      {showRotateTip ? (
        <button
          type="button"
          className="fixed inset-0 z-[400] flex flex-col items-center justify-center gap-[16px] bg-black/72 px-[32px] text-center backdrop-blur-[4px]"
          onClick={() => setShowRotateTip(false)}
        >
          <span className="text-[48px]" aria-hidden>
            📱↻
          </span>
          <p className="max-w-[280px] text-[26px] font-semibold leading-snug text-white">
            横屏阅读体验更佳，建议旋转设备
          </p>
          <span className="text-[22px] text-white/75">点击继续（仍可竖屏浏览）</span>
        </button>
      ) : null}

      <div
        className="relative shrink-0 overflow-visible"
        style={{
          width: DESIGN_W * scale,
          height: DESIGN_H * scale,
        }}
      >
        <div
          className="absolute left-0 top-0 overflow-hidden bg-black"
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* 以下结构与类名来自 Figma MCP get_design_context（4291:831），图片路径指向 public/read-page-figma */}
          <div className="relative size-full" data-node-id="4291:831" data-name="电子绘本朗读页">
            <div
              className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2 h-[375px] w-[667px]"
              data-node-id="4291:858"
              data-name="背景图"
            >
              <img
                alt=""
                className="pointer-events-none absolute inset-0 size-full max-w-none object-cover"
                src={FIGMA.bg}
              />
            </div>

            <div
              className="absolute left-[60px] top-[42px] flex content-stretch items-start gap-[10px]"
              data-node-id="4292:866"
            >
              <div className="relative h-[273px] w-[545px] shrink-0" data-node-id="4291:852" data-name="绘本图展示区域">
                <img
                  alt=""
                  className="pointer-events-none absolute inset-0 size-full max-w-none object-cover"
                  src={pageImageSrc}
                />
              </div>

              <div
                className="relative flex h-[146px] shrink-0 content-stretch items-start py-[10px]"
                data-node-id="4292:865"
                data-name="右侧按钮"
              >
                <div
                  className="relative flex w-[35px] shrink-0 flex-col content-stretch items-start gap-[10px]"
                  data-node-id="4292:864"
                  data-name="按钮"
                >
                  <button
                    type="button"
                    className="relative h-[62px] w-full shrink-0 cursor-pointer overflow-clip border-0 bg-transparent p-0"
                    data-node-id="4291:839"
                    data-name="bgm按钮"
                    aria-label={bgmOn ? '关闭背景音乐' : '开启背景音乐'}
                    onClick={() => setBgmOn((v) => !v)}
                  >
                    <div className="absolute left-0 top-[5px] h-[52px] w-[31px]" data-node-id="4291:840">
                      <div className="absolute inset-[-9.62%_-12.21%_-9.62%_-16.13%]">
                        <img alt="" className="block size-full max-w-none" src={FIGMA.tabShell} />
                      </div>
                    </div>
                    <div className="absolute left-[-1px] top-[18px] size-[24px]" data-node-id="4291:842" data-name="音乐 1">
                      <img alt="" className="absolute inset-0 block size-full max-w-none" src={FIGMA.iconMusic} />
                    </div>
                    {bgmOn ? (
                      <div
                        className="absolute left-[15px] top-[34px] size-[10px]"
                        data-node-id="4291:846"
                        data-name="Check-one (校验)"
                      >
                        <div className="absolute inset-[8.33%]" data-node-id="I4291:846;4291:778" data-name="Vector">
                          <div className="absolute inset-[-12%]">
                            <img alt="" className="block size-full max-w-none" src={FIGMA.checkRing} />
                          </div>
                        </div>
                        <div
                          className="absolute inset-[37.5%_29.17%_37.5%_33.33%]"
                          data-node-id="I4291:846;4291:779"
                          data-name="Vector"
                        >
                          <div className="absolute inset-[-20%_-13.33%]">
                            <img alt="" className="block size-full max-w-none" src={FIGMA.checkMark} />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    className="relative h-[62px] w-full shrink-0 cursor-pointer overflow-clip border-0 bg-transparent p-0"
                    data-node-id="4291:847"
                    data-name="音色选择按钮"
                    aria-label={`选择朗读音色，当前：${currentVoiceName}`}
                    onClick={() => setVoicePanelOpen(true)}
                  >
                    <div className="absolute left-0 top-[5px] h-[52px] w-[31px]" data-node-id="4291:848">
                      <div className="absolute inset-[-9.62%_-12.21%_-9.62%_-16.13%]">
                        <img alt="" className="block size-full max-w-none" src={FIGMA.tabShell} />
                      </div>
                    </div>
                    <div className="absolute left-0 top-[19px] size-[24px]" data-node-id="4291:849" data-name="音色管理 1">
                      <img alt="" className="absolute inset-0 block size-full max-w-none" src={FIGMA.iconVoice} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div
              className="-translate-x-1/2 absolute left-1/2 top-[10px] flex w-[637px] content-stretch items-start justify-center"
              data-node-id="4291:861"
              data-name="顶栏"
            >
              <p
                className="relative w-[500px] shrink-0 truncate text-center text-[14px] font-medium not-italic leading-[normal] text-white"
                style={{ fontFamily: "'PingFang SC', sans-serif", textShadow: '0px 2px 2px rgba(0,0,0,0.35)' }}
                data-node-id="4291:853"
              >
                {titleWithProgress}
              </p>
            </div>

            <Link
              to="/"
              className="absolute left-[15px] top-[10px] z-[30] h-[41.5px] w-[41px]"
              data-node-id="4292:868"
              data-name="返回按钮"
              aria-label="返回书架"
            >
              <img
                alt=""
                className="pointer-events-none absolute inset-0 size-full max-w-none object-cover"
                src={FIGMA.back}
              />
            </Link>
          </div>

          {/* 稿外：保留翻页 / 播放能力 */}
          <div className="absolute bottom-[10px] left-1/2 z-[25] flex -translate-x-1/2 items-center gap-[18px]">
            <button
              type="button"
              onClick={goPrev}
              disabled={pageIndex <= 0}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white/25 bg-black/25 text-[18px] font-bold text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] backdrop-blur-[2px] disabled:opacity-35"
              aria-label="上一页"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#ffdb4d] text-[22px] font-bold text-[#4a2f22] shadow-[0_4px_0_rgba(180,130,40,0.9),0_10px_20px_rgba(0,0,0,0.35)] transition-transform active:translate-y-[2px]"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={pageIndex >= pages.length - 1}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white/25 bg-black/25 text-[18px] font-bold text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] backdrop-blur-[2px] disabled:opacity-35"
              aria-label="下一页"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {voicePanelOpen ? (
        <div className="fixed inset-0 z-[320] flex flex-col justify-end bg-black/55" role="dialog">
          <button
            type="button"
            className="min-h-0 flex-1 cursor-default"
            aria-label="关闭"
            onClick={() => setVoicePanelOpen(false)}
          />
          <div className="max-h-[58vh] overflow-hidden rounded-t-[20px] bg-[#3d2619] shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/10 px-[16px] py-[14px]">
              <span className="text-[24px] font-bold text-white">选择朗读音色</span>
              <button
                type="button"
                className="rounded-[10px] px-[12px] py-[8px] text-[22px] text-white/75 active:bg-white/10"
                onClick={() => setVoicePanelOpen(false)}
              >
                关闭
              </button>
            </div>
            <div className="max-h-[46vh] overflow-y-auto px-[16px] pb-[calc(16px+env(safe-area-inset-bottom))] pt-[10px]">
              <p className="mb-[10px] text-[20px] font-semibold text-white/55">预设音色</p>
              <div className="mb-[16px] flex flex-col gap-[8px]">
                {presetChoices.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVoiceId(v.id)
                      setVoicePanelOpen(false)
                    }}
                    className={`rounded-[14px] px-[16px] py-[14px] text-left text-[24px] font-semibold ${selectedVoiceId === v.id ? 'bg-[#ffdb4d] text-[#4a2f22]' : 'bg-white/10 text-white'}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
              <p className="mb-[10px] text-[20px] font-semibold text-white/55">我的克隆音色</p>
              {clonedChoices.length === 0 ? (
                <p className="mb-[12px] rounded-[14px] bg-white/5 px-[14px] py-[16px] text-[22px] text-white/45">
                  暂无，可在首页「音色克隆」录制
                </p>
              ) : (
                <div className="mb-[12px] flex flex-col gap-[8px]">
                  {clonedChoices.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVoiceId(v.id)
                        setVoicePanelOpen(false)
                      }}
                      className={`rounded-[14px] px-[16px] py-[14px] text-left text-[24px] font-semibold ${selectedVoiceId === v.id ? 'bg-[#7ED957]/90 text-[#1e293b]' : 'bg-white/10 text-white'}`}
                    >
                      <span className="mr-[8px] text-[20px]" aria-hidden>
                        🎙️
                      </span>
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-center text-[18px] leading-relaxed text-white/40">
                Demo：朗读音频仍为预设 MP3；克隆音色仅作选择与流程演示。
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
