export interface RawAclStatus {
  frm: string[] // From Port
  pkts: string[] // Hits
  smac: string[] // MAC Src
  smsk: string[] // MAC Src Mask
  dmac: string[] // MAC Dst
  dmsk: string[] // MAC Dst Mask
  et: string[] // Ethertype
  vtag: string[] // VLAN Tag Match
  vlan: string[] // VLAN ID
  prio: string[] // Priority
  sip: string[] // IP Src
  sipm: string[] // IP Src Mask
  sprt: string[] // IP Src Port
  dip: string[] // IP Dst
  dipm: string[] // IP Dst Mask
  dprt: string[] // IP Dst Port
  prot: string[] // Protocol
  dscp: string[] // DSCP
  redr: string[] // Redirect
  rdto: string[] // Redirect To
  mirr: string[] // Mirror
  drop: string[] // Drop
  rate: string[] // Rate
  svid: string[] // Set VLAN ID
  spri: string[] // Set Priority
}
