/** 竖屏设计稿基准 9:16 */
export const PORTRAIT_DESIGN = { width: 1080, height: 1920 } as const

/** 横屏设计稿基准 16:9 */
export const LANDSCAPE_DESIGN = { width: 1920, height: 1080 } as const

/**
 * 逻辑舞台尺寸（与现有页面 Tailwind 基准一致）
 * 竖屏：375×667
 * 横屏：667×375
 */
export const LOGICAL_STAGE_W = 375
export const LOGICAL_STAGE_H = 667

/** 获取当前方向的逻辑舞台尺寸 */
export function getLogicalStageSize(isLandscape: boolean) {
  return isLandscape
    ? { width: LOGICAL_STAGE_H, height: LOGICAL_STAGE_W } // 横屏：667×375
    : { width: LOGICAL_STAGE_W, height: LOGICAL_STAGE_H } // 竖屏：375×667
}
