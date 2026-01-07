import type { IpAddress, MacAddress } from './branded.js'

import type { AddressAcquisition, PoEOutMode } from './mikrotik-fields.js'

export interface SysPort {
  mikrotikDiscoveryProtocol: boolean
  allowFrom: boolean
  igmpFastLeave: boolean
  trusted: boolean // dtrp
}

export interface Sys {
  identity: string // id
  macAddress: MacAddress // mac
  serialNumber: string // ser / sid
  version: string // ver
  boardName: string // brd
  uptime: number // upt

  addressAcquisition: AddressAcquisition // iptp
  staticIpAddress: IpAddress // ip / sip?

  watchdog: boolean // wdt
  mikrotikDiscoveryProtocol: boolean // dsc
  independentVlanLookup: boolean // ivl
  igmpSnooping: boolean // igmp
  addInformationOption: boolean // ainf

  allowFromIp: IpAddress // alla
  allowFromIpMask: number // allm
  allowFromVlan: number // avln

  // Optional / Device Specific
  poeOutMode?: PoEOutMode // poe
  temperature?: number // temp
  cpuTemperature?: number
  voltage?: number // volt

  ports: SysPort[]
}

export interface RawSysStatus {
  upt: string
  ip: string
  mac: string
  sid: string
  id: string
  ver: string
  brd: string
  bld: string
  wdt: string
  dsc: string
  ivl: string
  alla: string
  allm: string
  allp: string
  avln: string
  prio: string
  cost: string
  rpr: string
  rmac: string
  igmp: string
  sip: string
  iptp: string
  volt: string
  temp: string
  lcbl: string
  upgr: string
  igfl: string
  // Optional fields
  pdsc?: string
  dtrp?: string // Trusted Ports
  ainf?: string // Add Information Option
  poe?: string // PoE Out Mode
  poes?: string // PoE Out Status
  igmq?: string
  igve?: string
  frmc?: string
}
