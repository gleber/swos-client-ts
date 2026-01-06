export enum PoeMode {
  Off = 'off',
  Auto = 'auto',
  On = 'on',
  Calib = 'calib',
}

export enum PoeStatus {
  Unavailable = 'unavailable',
  Disabled = 'disabled',
  WaitingForLoad = 'waiting-for-load',
  Active = 'active',
}

export interface Link {
  name: string
  enabled: boolean
  linkUp: boolean
  duplex: boolean
  duplexControl: boolean
  flowControl: boolean
  autoNegotiation: boolean
  poeMode: PoeMode
  poePrio: number
  poeStatus: PoeStatus
  speedControl: number
  power: number
  current: number
}

export interface LinkStatus {
  links: Link[]
}

export interface RawLinkStatus {
  nm: string[]
  en: string
  lnk: string
  spd: string[]
  dpx: string
  an: string
  spdc: string[]
  dpxc: string
  fct: string
  poe: string[]
  prio: string[]
  poes: string[]
  curr: string[]
  pwr: string[]
}

export interface LinkConfig {
  nm: string[]
  en: number
  an: number
  spdc: number[]
  dpxc: number
  fct: number
  poe: number[] // or PoeMode[]
  prio: number[]
}
