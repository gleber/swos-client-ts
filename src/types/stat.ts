export interface PortStats {
  rxRate: number // rrb
  txRate: number // trb
  rxPacketRate: number // rrp
  txPacketRate: number // trp
  rxBytes: number // rb + rbh
  txBytes: number // tb + tbh
  rxTotalPackets: number // rtp
  txTotalPackets: number // ttp
  rxUnicastPackets: number // rup + ruph
  txUnicastPackets: number // tup + tuph
  rxBroadcastPackets: number // rbp + rbph
  txBroadcastPackets: number // tbp + tbph
  rxMulticastPackets: number // rmp + rmph
  txMulticastPackets: number // tmp + tmph
  rxPauses: number // rpp
  rxMacErrors: number // rte
  rxFcsErrors: number // rfcs
  rxJabber: number // rae
  rxRunts: number // rr
  rxFragments: number // fr
  rxOverruns: number // rov
  txPauses: number // tpp
  txUnderruns: number // tur
  txCollisions: number // tcl
  txMultipleCollisions: number // tmc
  txExcessiveCollisions: number // tec
  txLateCollisions: number // tlc
  txDeferred: number // tdf
}

export interface RawStatsStatus {
  // Stats
  rrb: string[] // Rx Rate
  trb: string[] // Tx Rate
  rrp: string[] // Rx Packet Rate
  trp: string[] // Tx Packet Rate
  rb: string[] // Rx Bytes
  rbh: string[] // Rx Bytes High
  tb: string[] // Tx Bytes
  tbh: string[] // Tx Bytes High
  rtp: string[] // Rx Total Packets
  ttp: string[] // Tx Total Packets
  rup: string[] // Rx Unicasts
  ruph: string[] // Rx Unicast High
  tup: string[] // Tx Unicasts
  tuph: string[] // Tx Unicast High
  rbp: string[] // Rx Broadcasts
  rbph: string[] // Rx Broadcast High
  tbp: string[] // Tx Broadcasts
  tbph: string[] // Tx Broadcast High
  rmp: string[] // Rx Multicasts
  rmph: string[] // Rx Multicast High
  tmp: string[] // Tx Multicasts
  tmph: string[] // Tx Multicast High
  tq: string[] // Tx Queue
  tqb: string[] // Tx Queue Bytes

  // Errors
  rpp: string[] // Rx Pauses
  rte: string[] // Rx MAC Errors
  rfcs: string[] // Rx FCS Errors
  rae: string[] // Rx Jabber
  rr: string[] // Rx Runts
  fr: string[] // Rx Fragments
  rov: string[] // Rx Overruns
  tpp: string[] // Tx Pauses
  tur: string[] // Tx Underruns
  tcl: string[] // Tx Collisions
  tmc: string[] // Tx Multiple Collisions
  tec: string[] // Tx Excessive Collisions
  tlc: string[] // Tx Late Collisions
  tdf: string[] // Tx Deferred

  // Hist
  p64: string[] // 64
  p65: string[] // 65-127
  p128: string[] // 128-255
  p256: string[] // 256-511
  p512: string[] // 512-1023
  p1k: string[] // 1024-max
}
