export enum VlanPortMode {
  LeaveAsIs = 'leave-as-is',
  AlwaysStrip = 'always-strip',
  AddIfMissing = 'add-if-missing',
  NotAMember = 'not-a-member',
}

export interface Vlan {
  id: number
  independentVlanLookup: boolean
  igmpSnooping: boolean
  portMode: VlanPortMode[]
}

export interface RawVlanStatus {
  vid: string
  ivl: string
  igmp: string
  prt: string[]
}
