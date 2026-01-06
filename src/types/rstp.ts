export interface Rstp {
  enabled: boolean;
  role: number[];
  status: number[];
  priority: number[];
  cost: number[];
  portId: number[];
}

export interface RawRstpStatus {
  en: string;
  role: string[];
  sta: string[];
  prio: string[];
  cost: string[];
  port: string[];
}