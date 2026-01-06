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
  pn: string;
  sn: string;
  temp: string;
  tx: string;
  rx: string;
  vcc: string;
}