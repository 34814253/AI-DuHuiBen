import type { VoiceMeta } from '../types/voice'

const STORAGE_KEY = 'zhihuiben_voices_v1'

function safeParse(raw: string | null): VoiceMeta[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter(
      (item): item is VoiceMeta =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as VoiceMeta).id === 'string' &&
        typeof (item as VoiceMeta).name === 'string',
    )
  } catch {
    return []
  }
}

export function loadVoices(): VoiceMeta[] {
  return safeParse(localStorage.getItem(STORAGE_KEY))
}

export function saveVoices(list: VoiceMeta[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function appendVoice(meta: VoiceMeta): void {
  const list = loadVoices()
  list.unshift(meta)
  saveVoices(list)
}
