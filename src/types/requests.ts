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
  sip: number
  id: string
  alla: number
  allm: number
  allp: number
  avln: number
  ivl: number
  igmp: number
  igmq: number
  igfl: number
  igve: number
  pdsc: number
  lcbl: number
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
