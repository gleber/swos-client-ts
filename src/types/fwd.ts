export interface Fwd {
  enabled: boolean[];
  linkUp: boolean[];
  flowControl: boolean[];
  mirror: number;
  defaultVlanId: number[];
  vlanId: number[];
  vlanMode: number[];
  locked: boolean[];
  rateLimit: number[];
  broadcastLimit: number[];
  multicastLimit: number[];
  unicastLimit: number[];
}

export interface RawFwdStatus {
  en: string;
  lnk: string;
  fct: string;
  mir: string;
  pvid: string[];
  vid: string[];
  vmde: string[];
  lock: string[];
  rate: string[];
  bcst: string[];
  mcst: string[];
  ucst: string[];
}