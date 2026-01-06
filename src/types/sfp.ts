export interface SfpStatus {
  vendor: string
  partNumber: string
  serialNumber: string
  temperature: number
  txPower: number
  rxPower: number
  voltage: number
}

export interface RawSfpStatus {
  vnd: string | string[]
  pnr: string | string[]
  rev: string | string[]
  ser: string | string[]
  dat: string | string[]
  typ: string | string[]
  wln: string | string[]
  tmp: string | string[]
  vcc: string | string[]
  tbs: string | string[]
  tpw: string | string[]
  rpw: string | string[]
}
