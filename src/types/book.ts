export type BookItem = {
  id: string
  title: string
  author: string
  /** 相对 public 或外链（Demo 仅用本地路径） */
  coverUrl?: string
}

/** 单页朗读资源（图片 + 音频时长；音频可为占位路径） */
export type BookPage = {
  pageNumber: number
  /** 可选：public 下 JPG/PNG；缺失时用渐变占位 */
  imageUrl?: string
  /** 可选：public 下 MP3；缺失时用内置节拍模拟朗读时长 */
  audioUrl?: string
  /** 朗读时长（秒），用于无音频时的模拟进度 */
  durationSec: number
}
