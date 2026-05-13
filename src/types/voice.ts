export type VoiceRoleId = 'mom' | 'dad' | 'grandma' | 'grandpa' | 'custom'

export type VoiceMeta = {
  id: string
  name: string
  /** 角色标识，自定义时为 custom */
  role: VoiceRoleId
  type: 'cloned'
  createdAt: number
}
