export interface Rstp {
  enabled: boolean;
  role: number[];
  status: number[];
  priority: number[];
  cost: number[];
  portId: number[];
}

export interface RawRstpStatus {
  rpc: string[];
  cst: string[];
  ena: string;
  rstp: string;
  p2p: string;
  edge: string;
  lrn: string;
  fwd: string;
  role: string[];
}