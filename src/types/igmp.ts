export interface RawIgmpEntry {
  addr: string // Group Address
  vlan: string // VLAN
  prts: string // Member Ports (hex string bitmask)
}

export interface RawIgmpStatus {
  // !igmp.b returns an array of entries
  [key: string]: RawIgmpEntry[] | unknown
}
