import type { BookItem } from '../types/book'

/** 扫码识别成功时的 Demo 绘本（封面 / 分页 / 音频见 public/mock-assets、public/mock-audio） */
export function createDetectedQrBook(): BookItem {
  return {
    id: `book-${Date.now()}`,
    title: '快乐的光脚丫先生',
    author: '张三',
    coverUrl: '/mock-assets/covers/book1.png',
  }
}
