/** 竖屏设计稿基准 9:16 */
export const PORTRAIT_DESIGN = { width: 1080, height: 1920 } as const

/** 横屏设计稿基准 16:9 */
export const LANDSCAPE_DESIGN = { width: 1920, height: 1080 } as const

/**
 * 与现有页面 Tailwind 基准一致（原 max-w-[375px]、Scan 画布 667 等），
 * 在固定设计分辨率内等比放大/居中，避免整站改坐标。
 */
export const LOGICAL_STAGE_W = 375
export const LOGICAL_STAGE_H = 667
