export enum PoeMode {
  Off = 0,
  Auto = 1,
  On = 2,
  Calib = 3,
}

export enum PoeStatus {
  Unavailable = 0,
  Disabled = 1,
  WaitingForLoad = 2,
  Active = 3,
}

export interface Link {
  name: string;
  enabled: boolean;
  linkUp: boolean;
  duplex: boolean;
  duplexControl: boolean;
  flowControl: boolean;
  autoNegotiation: boolean;
  poeMode: PoeMode;
  poePrio: number;
  poeStatus: PoeStatus;
  speedControl: number;
  power: number;
  current: number;
}

export interface LinkStatus {
  links: Link[];
}

export interface RawLinkStatus {
  nm: string[];
  en: string;
  lnk: string;
  spd: string[];
  dpx: string;
  an: string;
  spdc: string[];
  dpxc: string;
  fct: string;
  poe: string[];
  prio: string[];
  poes: string[];
  curr: string[];
  pwr: string[];
}