import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { putVoiceBlob } from '../lib/voiceDb'
import { appendVoice } from '../lib/voiceListStorage'
import type { VoiceRoleId } from '../types/voice'

const ROLES: { id: VoiceRoleId; label: string; presetName: string }[] = [
  { id: 'mom', label: '妈妈', presetName: '妈妈的声音' },
  { id: 'dad', label: '爸爸', presetName: '爸爸的声音' },
  { id: 'grandma', label: '奶奶', presetName: '奶奶的声音' },
  { id: 'grandpa', label: '爷爷', presetName: '爷爷的声音' },
  { id: 'custom', label: '自定义', presetName: '' },
]

export function VoiceSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const blob = (location.state as { blob?: Blob } | null)?.blob

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [roleId, setRoleId] = useState<VoiceRoleId>('mom')
  const [name, setName] = useState(ROLES[0].presetName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const objectUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : ''), [blob])

  useEffect(() => {
    if (!blob) {
      navigate('/voice-record', { replace: true })
    }
  }, [blob, navigate])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  useEffect(() => {
    if (roleId === 'custom') return
    const r = ROLES.find((x) => x.id === roleId)
    if (r?.presetName) setName(r.presetName)
  }, [roleId])

  const togglePreview = () => {
    const el = audioRef.current
    if (!el || !objectUrl) return
    if (playing) {
      el.pause()
    } else {
      void el.play().catch(() => {})
    }
  }

  const save = async () => {
    if (!blob || !name.trim()) {
      setError('请填写音色名称')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const id = `voice-${Date.now()}`
      await putVoiceBlob(id, blob)
      appendVoice({
        id,
        name: name.trim(),
        role: roleId,
        type: 'cloned',
        createdAt: Date.now(),
      })
      navigate('/', { replace: true })
    } catch {
      setError('保存失败，请重试')
      setSaving(false)
    }
  }

  if (!blob) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#FFF8E7] text-[#6B7280]">
        跳转中…
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FFF8E7] px-[20px] pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] text-[#2C3E50]">
      <header className="mb-[20px] flex items-center justify-between">
        <Link
          to="/"
          className="rounded-[12px] bg-white px-[14px] py-[10px] text-[22px] font-semibold shadow-[0_4px_0_rgba(44,62,80,0.06)]"
        >
          ✕
        </Link>
        <span className="text-[24px] font-bold">音色保存</span>
        <span className="w-[44px]" />
      </header>

      <div className="mb-[20px] rounded-[24px] bg-white px-[20px] py-[24px] text-center shadow-[0_8px_0_rgba(232,137,46,0.12)]">
        <p className="text-[40px] leading-none">✅</p>
        <p className="mt-[12px] text-[28px] font-bold text-[#7ED957]">音色生成成功！</p>
        <p className="mt-[8px] text-[22px] text-[#6B7280]">试听无误后可命名并保存到本地</p>
      </div>

      <audio
        ref={audioRef}
        src={objectUrl || undefined}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <div className="mb-[16px] rounded-[20px] bg-[#2C3E50]/[0.06] px-[16px] py-[18px]">
        <div className="flex items-center justify-between gap-[16px]">
          <button
            type="button"
            onClick={togglePreview}
            className="rounded-full bg-[#FF9F3A] px-[24px] py-[12px] text-[22px] font-bold text-white shadow-[0_4px_0_#E8892E]"
          >
            {playing ? '暂停试听' : '试听录音'}
          </button>
          <div className="flex flex-1 items-end justify-end gap-[3px] overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className={`w-[5px] rounded-full bg-[#FF9F3A] transition-[height] duration-150 ${playing ? 'animate-pulse' : ''}`}
                style={{
                  height: playing ? `${10 + ((i * 17) % 36)}px` : '8px',
                  opacity: playing ? 1 : 0.35,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mb-[8px] text-[22px] font-semibold">选择角色</p>
      <div className="mb-[16px] flex flex-wrap gap-[10px]">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRoleId(r.id)}
            className={`rounded-full px-[18px] py-[10px] text-[22px] font-semibold ${roleId === r.id ? 'bg-[#FF9F3A] text-white shadow-[0_4px_0_#E8892E]' : 'bg-white text-[#4B5563] shadow-sm'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <label className="mb-[8px] block text-[22px] font-semibold">音色名称</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={roleId === 'custom' ? '请输入名称' : ''}
        className="mb-[20px] w-full rounded-[16px] border-2 border-[#E5E7EB] bg-white px-[16px] py-[14px] text-[24px] outline-none focus:border-[#FF9F3A]"
      />

      {error ? (
        <p className="mb-[12px] text-center text-[22px] text-[#DC2626]">{error}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-[14px] pt-[12px]">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-full bg-[#FF9F3A] py-[16px] text-[26px] font-bold text-white shadow-[0_8px_0_#E8892E] disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => navigate('/voice-record', { replace: true })}
          className="rounded-full border-2 border-[#FF9F3A] bg-white py-[16px] text-[26px] font-bold text-[#FF9F3A]"
        >
          重新录制
        </button>
      </div>
    </div>
  )
}
