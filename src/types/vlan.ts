export enum VlanPortMode {
  LeaveAsIs = 'leave-as-is',
  AlwaysStrip = 'always-strip',
  AddIfMissing = 'add-if-missing',
  NotAMember = 'not-a-member',
}

export interface Vlan {
  id: number
  name?: string
  portIsolation?: boolean // or bitmask? Dump says 'l:1' which usually means bitmask length or just boolean.
  // Dump: id: 'piso', t: G (checkbox/boolean), l: 1.
  // If 't: G', it's usually boolean. But 'l: 1' might mean per-port?
  // Mikrotik dump line 833: { n: 'Port Isolation', id: 'piso', t: G, l: 1 }.
  // 'l: 1' usually implies length. But 't: G' is checkbox.
  // Actually, 'h: r' used for per-port arrays (e.g. line 858).
  // 'id: piso' has no 'a: 1' or 'h: r'.
  // 'l: 1' might mean label width or something.
  // Let's treat as boolean for now unless data shows otherwise.
  learning?: boolean
  mirror?: boolean
  members: string // hex bitmask

  independentVlanLookup: boolean
  igmpSnooping: boolean
  portMode: VlanPortMode[]
}

export interface RawVlanStatus {
  vid: string
  ivl: string
  igmp: string

  nm?: string
  piso?: string
  lrn?: string
  mrr?: string
  mbr?: string // Members hex bitmask

  prt?: string[] // Optional now as it might be missing
}
