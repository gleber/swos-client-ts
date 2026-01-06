export interface Sys {
  mac: string;
  serialNumber: string;
  identity: string;
  version: string;
  boardName: string;
  rootBridgeMac: string;
  uptime: number;
  ip: string;
  build: number;
  dsc: number;
  wdt: number;
  mikrotikDiscoveryProtocol: boolean[];
  independentVlanLookup: boolean;
  allowFrom: string;
  allm: number;
  allowFromPorts: boolean[];
  allowFromVlan: number;
  igmpSnooping: boolean;
  igmpQuerier: boolean;
  longPoeCable: boolean;
  igmpFastLeave: boolean[];
  igmpVersion: number;
  voltage: number;
  temperature: number;
  bridgePriority: number;
  portCostMode: number;
  forwardReservedMulticast: boolean;
  addressAcquisition: number;
  staticIpAddress: string;
}

export interface RawSysStatus {
  upt: string;
  ip: string;
  mac: string;
  sid: string;
  id: string;
  ver: string;
  brd: string;
  bld: string;
  wdt: string;
  dsc: string;
  ivl: string;
  alla: string;
  allm: string;
  allp: string;
  avln: string;
  prio: string;
  cost: string;
  rpr: string;
  rmac: string;
  igmp: string;
  sip: string;
  iptp: string;
  volt: string;
  temp: string;
  lcbl: string;
  upgr: string;
  igfl: string;
  // Optional fields
  pdsc?: string;
  igmq?: string;
  igve?: string;
  frmc?: string;
}