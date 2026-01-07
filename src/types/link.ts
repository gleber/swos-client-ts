import type {
  CablePairStatus,
  ComboMode,
  DuplexMode,
  FlowControl,
  LastHopStatus,
  LinkStatus as LinkStatusEnum,
  QSFPType,
} from './mikrotik-fields.js'

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

export enum LinkSpeed {
  Speed10M = '10M',
  Speed100M = '100M',
  Speed1G = '1G',
  Unavailable = 'unavailable',
}

export interface Link {
  name: string
  enabled: boolean
  linkStatus: LinkStatusEnum
  duplex: DuplexMode
  duplexControl: boolean
  flowControl: FlowControl
  autoNegotiation: boolean
  poeMode: PoeMode
  poePrio: number
  poeStatus: PoeStatus
  speed: LinkSpeed
  speedControl: number
  power: number
  current: number

  // New fields
  blockOnNoPower?: boolean // blkp
  comboMode?: ComboMode // cm
  qsfpType?: QSFPType // qtyp
  totalFlowControl?: FlowControl // tfct
  cableTest?: {
    lastHop?: LastHopStatus // hops
    length?: number // len (meters)
    faultAt?: number // flt (meters)
    pairStatus?: CablePairStatus // pair
  }
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
  // New fields from mikrotik-dump.js
  blkp?: string // Block On No Power
  cm?: string // Combo Mode
  qtyp?: string // QSFP Type
  tfct?: string[] // Flow Control (Total?)
  fctc?: string // Flow Control Tx?
  fctr?: string // Flow Control Rx?
  hop?: string[] // Hops
  hops?: string[] // Last Hop
  len?: string[] // Length
  flt?: string[] // Fault At
  pair?: string[] // Cable Pairs
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
