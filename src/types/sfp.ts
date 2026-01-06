export interface SfpStatus {
  vendor: string;
  partNumber: string;
  serialNumber: string;
  temperature: number;
  txPower: number;
  rxPower: number;
  voltage: number;
}

export interface RawSfpStatus {
  vnd: string;
  pnr: string;
  rev: string;
  ser: string;
  dat: string;
  typ: string;
  wln: string;
  tmp: string;
  vcc: string;
  tbs: string;
  tpw: string;
  rpw: string;
}