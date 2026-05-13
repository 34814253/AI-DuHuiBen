import type { CSSProperties } from 'react'
import type { BookItem, BookPage } from '../types/book'

/** 扫码 Demo 绘本《快乐的光脚丫先生》：分页图 + 朗读音频（public/mock-assets、public/mock-audio） */
const HAPPY_FEET_PAGES: BookPage[] = [
  {
    pageNumber: 1,
    durationSec: 5,
    imageUrl: '/mock-assets/pages/book1-page1.png',
    audioUrl: '/mock-audio/book1-page1.mp3',
  },
  {
    pageNumber: 2,
    durationSec: 4,
    imageUrl: '/mock-assets/pages/book1-page2.png',
    audioUrl: '/mock-audio/book1-page2.mp3',
  },
  {
    pageNumber: 3,
    durationSec: 6,
    imageUrl: '/mock-assets/pages/book1-page3.png',
    audioUrl: '/mock-audio/book1-page3.mp3',
  },
  {
    pageNumber: 4,
    durationSec: 5,
    imageUrl: '/mock-assets/pages/book1-page4.png',
    audioUrl: '/mock-audio/book1-page4.mp3',
  },
  {
    pageNumber: 5,
    durationSec: 4,
    imageUrl: '/mock-assets/pages/book1-page5.png',
    audioUrl: '/mock-audio/book1-page5.mp3',
  },
]

/** 其它书名：仍用同一套 book1 前三页资源作短 Demo（可后续换独立素材） */
const GENERIC_PAGES: BookPage[] = [
  {
    pageNumber: 1,
    durationSec: 4,
    imageUrl: '/mock-assets/pages/book1-page1.png',
    audioUrl: '/mock-audio/book1-page1.mp3',
  },
  {
    pageNumber: 2,
    durationSec: 4,
    imageUrl: '/mock-assets/pages/book1-page2.png',
    audioUrl: '/mock-audio/book1-page2.mp3',
  },
  {
    pageNumber: 3,
    durationSec: 4,
    imageUrl: '/mock-assets/pages/book1-page3.png',
    audioUrl: '/mock-audio/book1-page3.mp3',
  },
]

const HAPPY_FEET_TITLE = '快乐的光脚丫先生'
/** 旧版扫码书名，书架里若仍有记录则与主绘本共用同一套分页资源 */
const LEGACY_TITLE = '小兔子的梦想'

export function getPagesForBook(book: BookItem): BookPage[] {
  if (book.title === HAPPY_FEET_TITLE || book.title === LEGACY_TITLE) {
    return HAPPY_FEET_PAGES
  }
  return GENERIC_PAGES
}

/** 每页插图占位渐变（无 imageUrl 时使用） */
export function getPagePlaceholderStyle(pageIndex: number): CSSProperties {
  const hues = [
    ['#FFE566', '#FF9F3A'],
    ['#5EC8FF', '#FF7BA3'],
    ['#7ED957', '#FFE566'],
    ['#FF9F3A', '#5EC8FF'],
    ['#FF7BA3', '#7ED957'],
  ]
  const [a, b] = hues[pageIndex % hues.length]
  return {
    background: `linear-gradient(145deg, ${a} 0%, ${b} 100%)`,
  }
}
