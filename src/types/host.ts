import { MacAddress } from './branded.js'

export interface RawHostEntry {
  prt: string // Port
  adr: string // MAC
  vid: string // VLAN ID
  drp?: string // Drop
  mir?: string // Mirror
}

export interface RawHostStatus {
  // host.b returns an array of entries
  [key: string]: RawHostEntry[] | unknown
}

export interface RawDynamicHostEntry {
  prt: string // Port
  adr: string // MAC
  vid: string // VLAN ID
}

export interface RawDynamicHostStatus {
  // !dhost.b returns an array of entries
  [key: string]: RawDynamicHostEntry[] | unknown
}
