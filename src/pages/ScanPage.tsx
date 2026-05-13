import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { playBeep } from '../audio/playBeep'
import { createDetectedQrBook } from '../mock/demoBook'

import { LOGICAL_STAGE_H, LOGICAL_STAGE_W } from '../constants/stage'

type ScanMode = 'scan' | 'photo'
type Phase = 'idle' | 'scanning' | 'recognizing'

/** 与全局逻辑舞台一致（OrientationStage 内 375×667） */
const CANVAS_W = LOGICAL_STAGE_W
const CANVAS_H = LOGICAL_STAGE_H

const FIGMA = {
  cameraBg: '/scan-page-figma/camera-bg.png',
  scanFrame: '/scan-page-figma/scan-frame.svg',
  iconTorch: '/scan-page-figma/icon-torch.svg',
  iconAlbum: '/scan-page-figma/icon-album.svg',
  iconBack: '/scan-page-figma/icon-back.svg',
} as const

function vibrateShort(): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50)
    }
  } catch {
    /* 忽略 */
  }
}

export function ScanPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mode, setMode] = useState<ScanMode>('scan')
  const [phase, setPhase] = useState<Phase>('idle')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [albumPreview, setAlbumPreview] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)

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
      if (timerRef.current) clearTimeout(timerRef.current)
      stopStream()
    }
  }, [startCamera, stopStream])

  useEffect(() => {
    return () => {
      if (albumPreview) URL.revokeObjectURL(albumPreview)
    }
  }, [albumPreview])

  const busy = phase !== 'idle'

  const finishScanFlow = useCallback(() => {
    vibrateShort()
    playBeep()
    const book = createDetectedQrBook()
    navigate('/scan-result', { state: { book } })
  }, [navigate])

  const runScanSimulation = useCallback(() => {
    if (busy) return
    setPhase('scanning')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setPhase('idle')
      finishScanFlow()
    }, 2000)
  }, [busy, finishScanFlow])

  const runPhotoSimulation = useCallback(() => {
    if (busy) return
    setPhase('recognizing')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setPhase('idle')
      playBeep()
    }, 2000)
  }, [busy])

  const handlePreviewPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      if (busy) return
      if (mode === 'scan') runScanSimulation()
      else runPhotoSimulation()
    },
    [busy, mode, runPhotoSimulation, runScanSimulation],
  )

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({
        // @ts-expect-error torch 非标准约束，部分安卓 Chrome 支持
        advanced: [{ torch: next }],
      })
      setTorchOn(next)
    } catch {
      /* 不支持则静默 */
    }
  }, [torchOn])

  const openAlbum = () => {
    fileInputRef.current?.click()
  }

  const onAlbumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (albumPreview) URL.revokeObjectURL(albumPreview)
    const url = URL.createObjectURL(f)
    setAlbumPreview(url)
    e.target.value = ''
  }

  return (
    <div className="relative flex h-full min-h-0 w-full max-w-[375px] flex-col bg-black text-white">
      <div
        className="relative mx-auto w-full overflow-hidden bg-black"
        style={{ minHeight: '667px' }}
      >
        <div
          className="relative mx-auto bg-black"
          style={{ width: CANVAS_W, minHeight: CANVAS_H }}
          data-node-id={mode === 'scan' ? '4298:1255' : '4298:1354'}
          data-name={mode === 'scan' ? '扫码/拍照页_扫二维码tab' : '扫码/拍照页_拍绘本tab'}
        >
          {/* 照片(用于模拟拍摄画面) — 实机为 video / 相册选图 */}
          <div
            className="absolute left-1/2 top-1/2 h-[667px] w-[375px] -translate-x-1/2 -translate-y-1/2"
            data-node-id={mode === 'scan' ? '4298:1350' : '4298:1355'}
            data-name="照片(用于模拟拍摄画面)"
          >
            <div className="absolute inset-0 overflow-hidden">
              {permissionDenied ? (
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-[16px] bg-black px-[24px] text-center">
                  <p className="text-[26px] font-semibold">需要摄像头权限</p>
                  <p className="text-[22px] leading-relaxed text-white/70">
                    请在系统设置中允许浏览器使用摄像头后重试
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="mt-[8px] rounded-full bg-[#ff7531] px-[28px] py-[14px] text-[24px] font-bold text-white"
                  >
                    重新请求
                  </button>
                </div>
              ) : albumPreview ? (
                <img
                  alt=""
                  className="absolute left-[-16.57%] top-0 h-full max-w-none w-[133.4%] object-cover"
                  src={albumPreview}
                />
              ) : (
                <video
                  ref={videoRef}
                  poster={FIGMA.cameraBg}
                  className="absolute left-[-16.57%] top-0 h-full max-w-none w-[133.4%] object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              )}
            </div>
          </div>

          {mode === 'scan' && !permissionDenied ? (
            <div
              className="pointer-events-none absolute left-0 top-0 z-[2] h-[667px] w-[375px] bg-black opacity-25"
              data-node-id="4298:1352"
              data-name="黑色遮罩"
            />
          ) : null}

          {!permissionDenied ? (
            <button
              type="button"
              tabIndex={0}
              className="absolute left-0 right-0 top-[100px] z-[8] cursor-pointer touch-manipulation bg-transparent"
              style={{
                bottom: 'calc(220px + env(safe-area-inset-bottom, 0px))',
                touchAction: 'manipulation',
              }}
              onPointerUp={handlePreviewPointerUp}
              aria-label={mode === 'scan' ? '点击识别' : '点击拍绘本'}
              disabled={busy}
            />
          ) : null}

          {mode === 'scan' && !permissionDenied ? (
            <div
              className="pointer-events-none absolute left-0 top-[160px] z-[4] flex w-[375px] flex-col content-stretch items-center gap-[15px]"
              data-node-id="4298:1353"
            >
              <div className="relative size-[236px] shrink-0" data-node-id="4298:1339" data-name="取景窗">
                <div className="absolute inset-[-0.64%] mix-blend-lighten">
                  <img alt="" className="block size-full max-w-none" src={FIGMA.scanFrame} />
                </div>
                <div
                  className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
                  aria-hidden
                  data-name="扫描线"
                >
                  <div
                    className="scan-line absolute left-[7%] right-[7%] h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#ff7531] to-transparent shadow-[0_0_12px_rgba(255,117,49,0.85)]"
                  />
                </div>
              </div>
              <div className="relative h-[19.5px] w-full shrink-0" data-node-id="4298:1317" data-name="小字提示">
                <p
                  className="absolute left-[187.5px] top-0 -translate-x-1/2 whitespace-nowrap text-center text-[13px] font-normal not-italic leading-[19.5px] tracking-[-0.0762px] text-[rgba(255,255,255,0.8)]"
                  style={{
                    fontFamily: 'Inter, "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif',
                  }}
                  data-node-id="4298:1318"
                >
                  请将二维码对准扫描框中心
                </p>
              </div>
            </div>
          ) : null}

          {mode === 'photo' && !permissionDenied ? (
            <div className="pointer-events-none absolute left-0 top-[280px] z-[4] w-[375px] px-[24px] text-center">
              <p
                className="text-[13px] font-normal leading-[19.5px] text-[rgba(255,255,255,0.8)]"
                style={{ fontFamily: 'Inter, "Noto Sans SC", sans-serif' }}
              >
                点击画面识别这一页
              </p>
            </div>
          ) : null}

          {mode === 'scan' && !permissionDenied ? (
            <div
              className="absolute left-0 top-[560px] z-[30] flex h-[76.5px] w-[375px] content-stretch items-start justify-center gap-[120px] px-[73.5px]"
              data-node-id="4298:1319"
              data-name="底部按钮"
            >
              <div className="relative h-[76.5px] w-[54px] shrink-0" data-node-id="4298:1320" data-name="Button">
                <button
                  type="button"
                  disabled={!!albumPreview}
                  onClick={() => void toggleTorch()}
                  className="relative size-full border-0 bg-transparent p-0"
                >
                  <div className="relative flex size-full flex-col content-stretch items-center gap-[6px] border-0 border-transparent bg-clip-padding">
                    <div
                      className="relative min-h-px w-[54px] flex-[1_0_0] rounded-full bg-[rgba(255,255,255,0.35)]"
                      data-node-id="4298:1321"
                      data-name="Container"
                    >
                      <div className="relative flex size-full content-stretch items-center justify-center border-0 border-transparent bg-clip-padding px-[14px]">
                        <div className="relative size-[26px] shrink-0" data-node-id="4298:1322" data-name="Icon">
                          <img alt="" className="absolute inset-0 block size-full max-w-none" src={FIGMA.iconTorch} />
                        </div>
                      </div>
                    </div>
                    <div className="relative h-[16.5px] w-[33px] shrink-0" data-node-id="4298:1326" data-name="Text">
                      <div className="relative size-full border-0 border-transparent bg-clip-padding">
                        <p
                          className="absolute left-[16px] top-0 -translate-x-1/2 whitespace-nowrap text-center text-[11px] font-medium not-italic leading-[16.5px] tracking-[0.0645px] text-white"
                          style={{ fontFamily: 'Inter, "Noto Sans SC", "Noto Sans JP", sans-serif' }}
                          data-node-id="4298:1327"
                        >
                          手电筒
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <div className="relative h-[76.5px] w-[54px] shrink-0" data-node-id="4298:1328" data-name="Button">
                <button type="button" onClick={openAlbum} className="relative size-full border-0 bg-transparent p-0">
                  <div className="relative flex size-full flex-col content-stretch items-center gap-[6px] border-0 border-transparent bg-clip-padding">
                    <div
                      className="relative min-h-px w-[54px] flex-[1_0_0] rounded-full bg-[rgba(255,255,255,0.35)]"
                      data-node-id="4298:1329"
                      data-name="Container"
                    >
                      <div className="relative flex size-full content-stretch items-center justify-center border-0 border-transparent bg-clip-padding px-[14px]">
                        <div className="relative size-[26px] shrink-0" data-node-id="4298:1330" data-name="Icon">
                          <img alt="" className="absolute inset-0 block size-full max-w-none" src={FIGMA.iconAlbum} />
                        </div>
                      </div>
                    </div>
                    <div className="relative h-[16.5px] w-[22px] shrink-0" data-node-id="4298:1334" data-name="Text">
                      <div className="relative size-full border-0 border-transparent bg-clip-padding">
                        <p
                          className="absolute left-[11.5px] top-0 -translate-x-1/2 whitespace-nowrap text-center text-[11px] font-medium not-italic leading-[16.5px] tracking-[0.0645px] text-white"
                          style={{ fontFamily: 'Inter, "Noto Sans JP", sans-serif' }}
                          data-node-id="4298:1335"
                        >
                          相册
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : null}

          <div
            className="absolute left-[calc(50%+0.5px)] top-[calc(20px+env(safe-area-inset-top))] z-[35] flex -translate-x-1/2 content-stretch items-center rounded-[8px] border border-solid border-[rgba(255,255,255,0.35)] p-[4px]"
            data-node-id={mode === 'scan' ? '4298:1269' : '4298:1382'}
            data-name="顶部tab栏"
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => setMode('scan')}
              className={`relative flex w-[76px] shrink-0 content-stretch items-center justify-center rounded-[5px] border-0 bg-transparent px-[8px] py-[4px] ${mode === 'scan' ? 'bg-white' : ''}`}
              data-node-id={mode === 'scan' ? '4298:1266' : '4298:1383'}
            >
              <p
                className={`relative shrink-0 whitespace-nowrap text-[15px] font-normal not-italic leading-[normal] ${mode === 'scan' ? 'text-[#4a4a4a]' : 'text-[#c4c4c4]'}`}
                style={{ fontFamily: "'PingFang SC', sans-serif" }}
                data-node-id={mode === 'scan' ? '4298:1264' : '4298:1384'}
              >
                扫二维码
              </p>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setMode('photo')}
              className={`relative flex w-[76px] shrink-0 content-stretch items-center justify-center rounded-[5px] border-0 bg-transparent px-[8px] py-[4px] ${mode === 'photo' ? 'bg-white' : ''}`}
              data-node-id={mode === 'scan' ? '4298:1267' : '4298:1385'}
            >
              <p
                className={`relative shrink-0 whitespace-nowrap text-[15px] font-normal not-italic leading-[normal] ${mode === 'photo' ? 'text-[#4a4a4a]' : 'text-[#c4c4c4]'}`}
                style={{ fontFamily: "'PingFang SC', sans-serif" }}
                data-node-id={mode === 'scan' ? '4298:1268' : '4298:1386'}
              >
                拍绘本
              </p>
            </button>
          </div>

          <Link
            to="/"
            className="absolute left-[10px] top-[calc(26px+env(safe-area-inset-top))] z-[35] size-[24px]"
            data-node-id={mode === 'scan' ? '4298:1259' : '4298:1387'}
            data-name="返回按钮"
            aria-label="关闭"
          >
            <span className="absolute bottom-1/4 left-[39.58%] right-[35.42%] top-1/4" data-node-id="I4298:1259;4298:1257" data-name="Vector">
              <span className="absolute inset-[-8.33%_-16.67%]">
                <img alt="" className="block size-full max-w-none" src={FIGMA.iconBack} />
              </span>
            </span>
          </Link>

          {mode === 'scan' && !permissionDenied ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runScanSimulation()}
              className="absolute left-[calc(50%+0.5px)] top-[500px] z-[32] flex h-[40px] w-[160px] -translate-x-1/2 content-stretch items-center justify-center rounded-[40px] bg-[#ff7531] p-[10px]"
              data-node-id="4298:1391"
            >
              <p
                className="relative shrink-0 whitespace-nowrap text-center text-[15px] font-semibold not-italic leading-[normal] text-white"
                style={{ fontFamily: "'PingFang SC', sans-serif" }}
                data-node-id="4298:1390"
              >
                演示：已扫码
              </p>
            </button>
          ) : null}

          {mode === 'photo' && !permissionDenied ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runPhotoSimulation()}
              className="absolute left-[calc(50%+0.5px)] top-[500px] z-[32] flex h-[40px] w-[160px] -translate-x-1/2 content-stretch items-center justify-center rounded-[40px] bg-[#ff7531] p-[10px]"
              data-node-id="4298:1392"
            >
              <p
                className="relative shrink-0 whitespace-nowrap text-center text-[15px] font-semibold not-italic leading-[normal] text-white"
                style={{ fontFamily: "'PingFang SC', sans-serif" }}
                data-node-id="4298:1393"
              >
                演示：已识别到绘本
              </p>
            </button>
          ) : null}

          {(phase === 'scanning' || phase === 'recognizing') && !permissionDenied ? (
            <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/35">
              <div className="flex flex-col items-center gap-[12px]">
                <div className="h-[52px] w-[52px] animate-spin rounded-full border-[4px] border-white/25 border-t-[#ff7531]" />
                <span className="text-[24px] font-semibold text-white">
                  {phase === 'recognizing' ? '正在识别…' : '扫描中…'}
                </span>
              </div>
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={onAlbumChange}
          />
        </div>
      </div>
    </div>
  )
}
