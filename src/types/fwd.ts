export interface FwdPort {
  enabled: boolean
  linkUp: boolean
  flowControl: boolean
  defaultVlanId: number
  vlanId: number
  vlanMode: number
  locked: boolean
  rateLimit: number
  broadcastLimit: number
  multicastLimit: number
  unicastLimit: number
}

export interface Fwd {
  mirror: number
  ports: FwdPort[]
}

export interface RawFwdStatus {
  ir: string[]
  or: string[]
  fp1: string
  fp2: string
  fp3: string
  fp4: string
  fp5: string
  fp6: string
  lck: string
  lckf: string
  imr: string
  omr: string
  mrto: string
  vlan: string[]
  vlnh: string[]
  vlni: string[]
  fvid: string
  dvid: string[]
  srt: string[]
  suni: string
}
