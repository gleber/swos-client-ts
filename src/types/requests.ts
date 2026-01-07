export interface LinkRequest {
  nm: string[]
  en: number
  an: number
  spdc: number[]
  dpxc: number
  fct: number
  prio: number[]
  poe: number[]
}

export interface SnmpRequest {
  en?: number
  com?: string
  ci?: string
  loc?: string
}

export interface SysRequest {
  iptp: number
  ip?: number // Changed from sip? dump says id:'ip'. Previous code used sip. Keeping both or checking?
  // Let's add common ones.
  sip?: number
  id: string
  alla: number
  allm: number
  allp: number
  avln: number
  ivl: number
  igmp: number
  igfl: number
  pdsc: number
  dtrp?: number
  wdt?: number
  dsc?: number
  ainf?: number
}

export interface VlanRequest {
  vid: number
  ivl: boolean
  igmp: boolean
  prt: number[]
}

export interface RstpRequest {
  ena: number
}

export interface FwdRequest {
  lck: number
  lckf: number
  imr: number
  omr: number
  mrto: number
  or: number[]
  vlan: number[]
  vlni: number[]
  dvid: number[]
  fvid: number
  vlnh: number[]
  // Dynamic fp fields: fp1, fp2, fp3, ..., fpN
  [key: `fp${number}`]: number | number[]
}
