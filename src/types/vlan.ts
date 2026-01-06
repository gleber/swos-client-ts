export enum VlanPortMode {
  LeaveAsIs = 0,
  AlwaysStrip = 1,
  AddIfMissing = 2,
  NotAMember = 3,
}

export interface Vlan {
  id: number;
  independentVlanLookup: boolean;
  igmpSnooping: boolean;
  portMode: VlanPortMode[];
}

export interface RawVlanStatus {
  vid: string;
  ivl: string;
  igmp: string;
  prt: string[];
}