import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  LANDSCAPE_DESIGN,
  PORTRAIT_DESIGN,
  getLogicalStageSize,
} from '../constants/stage'

function getIsLandscape(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth > window.innerHeight
}

/**
 * 竖屏：视口内最大 9:16 区域，设计分辨率 1080×1920，非 9:16 留黑边居中。
 * 横屏：视口内最大 16:9 区域，设计分辨率 1920×1080，非 16:9 留黑边居中。
 * 实现方式对齐 /Users/tal/Project/0507_MCP_test/src/app/Stage.tsx（ResizeObserver + scale）。
 */
export function OrientationStage({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isLandscape, setIsLandscape] = useState(getIsLandscape)

  const design = isLandscape ? LANDSCAPE_DESIGN : PORTRAIT_DESIGN
  const logicalStage = getLogicalStageSize(isLandscape)

  useEffect(() => {
    function onResize() {
      setIsLandscape(getIsLandscape())
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    function measure() {
      const node = hostRef.current
      if (!node) return
      const w = node.clientWidth
      const h = node.clientHeight
      if (!w || !h) return
      setScale(Math.min(w / design.width, h / design.height))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => {
      ro.disconnect()
    }
  }, [design.height, design.width])

  const contentK = Math.min(design.width / logicalStage.width, design.height / logicalStage.height)

  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div
        ref={hostRef}
        className="relative overflow-hidden bg-black"
        style={
          isLandscape
            ? {
                width: '100dvw',
                height: '56.25dvw', // 100 * 9/16
                maxHeight: '100dvh',
                maxWidth: '177.78dvh', // 100 * 16/9
              }
            : {
                width: '56.25dvh', // 100 * 9/16
                height: '100dvh',
                maxWidth: '100dvw',
                maxHeight: '177.78dvw', // 100 * 16/9
              }
        }
      >
        <div
          className="absolute left-0 top-0 origin-top-left will-change-transform"
          style={{
            height: design.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: design.width,
          }}
        >
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
            <div
              className="relative overflow-hidden"
              style={{
                height: logicalStage.height * contentK,
                width: logicalStage.width * contentK,
              }}
            >
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{
                  height: logicalStage.height,
                  transform: `scale(${contentK})`,
                  transformOrigin: 'top left',
                  width: logicalStage.width,
                }}
              >
                <div className="relative h-full min-h-0 w-full overflow-x-hidden">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
