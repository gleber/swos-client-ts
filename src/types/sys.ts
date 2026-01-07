import type { IpAddress, MacAddress } from './branded.js'

import type { AddressAcquisition, PSUStatus, PoEOutMode, PoEOutStatus } from './mikrotik-fields.js'

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
  cpuTemperature?: number // temp (ambiguous in dump, reused)
  boardTemperature?: number // btmp
  voltage?: number // volt

  fans: number[] // fan1, fan2...

  psu: {
    current?: number // p1c/p2c
    voltage?: number // p1v/p2v
    status?: PSUStatus // p1s/p2s
  }[]

  poeOutStatus?: PoEOutStatus[] // poes (per port status?)

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
  poes?: string | string[] // PoE Out Status
  // dump: poes: 'waiting for load;powered on...' (line 101) but 'id': 'poes' used in loop or separate?
  // dump line 1363: id: 'poes', a:1, i: POE_OUT_STATUS_VALUES. 'a:1' usually means array (per port).

  igmq?: string
  igve?: string
  frmc?: string
  // Health
  btmp?: string // Board Temp
  fan1?: string
  fan2?: string
  fan3?: string
  fan4?: string
  p1c?: string
  p1v?: string
  p1s?: string
  p2c?: string
  p2v?: string
  p2s?: string
}
