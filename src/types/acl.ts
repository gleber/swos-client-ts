import type { VLANTagMatch } from './mikrotik-fields.js'

export interface AclRule {
  enabled: boolean // en
  fromPorts: string // frm (hex bitmask?)
  hits: number // pkts

  // Match
  macSrc: string // smac
  macSrcMask: string // smsk
  macDst: string // dmac
  macDstMask: string // dmsk
  ethertype: string // et
  vlanTagMatch: VLANTagMatch // vtag
  vlanId: number // vlan
  priority: number // prio
  ipSrc: string // sip
  ipSrcMask: string // sipm
  ipSrcPort: number // sprt
  ipDst: string // dip
  ipDstMask: string // dipm
  ipDstPort: number // dprt
  protocol: number // prot
  dscp: number // dscp

  // Action
  redirect: boolean // redr
  redirectTo: number // rdto (port index?)
  mirror: boolean // mirr
  mirrorTo: number // mirp? (Wait, RawAclStatus has mirr. Is there a mirror port field?)
  // RawAclStatus has rdto, mirr, drop, rate, svid, spri.
  // mikrotik-dump lines 1120+ showed 'dmp' (Redirect To?). RawAclStatus has 'rdto'.
  // Let's assume rdto is Redirect To.
  drop: boolean // drop
  rateLimit: number // rate
  setVlanId: number // svid
  setPriority: number // spri
  comment: string // comm
}

export interface RawAclStatus {
  en?: string[] // Enabled (missing in previous RawAclStatus? Dump says 'en'?)
  // Checked mikrotik-dump: line 968 for SNMP has 'en'.
  // For ACL, line 1006 'From', id 'frm'.
  // Is there an 'en'? Note: usually rules have IDs from 0 to N.
  // RawAclStatus in previous `acl.ts` didn't have `en`.
  // But usually ACL entries are active if present.
  // Wait, `swos-client` repo or raw dump usually implies indices.
  // Let's check `RawAclStatus` again in `acl.ts`.
  // It starts with `frm`.
  // Maybe `en` is not there.

  comm: string[] // Comment

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

  // Actions
  redr: string[] // Redirect
  rdto: string[] // Redirect To
  mirr: string[] // Mirror
  drop: string[] // Drop
  rate: string[] // Rate
  svid: string[] // Set VLAN ID
  spri: string[] // Set Priority
}
