/**
 * Type definitions for Mikrotik SwOS API field values
 *
 * These enums represent the integer values returned by Mikrotik devices.
 * The device protocol uses integers for efficiency, but these enums provide
 * type-safe, human-readable names for use in TypeScript code.
 */

/**
 * Link Status values (field: lnk)
 */
export enum LinkStatus {
  /** No link detected */
  NoLink = 0,
  /** Link is active and operational */
  LinkOn = 1,
  /** No link detected (alternative state) */
  NoLinkAlt = 2,
  /** Link is paused (flow control) */
  LinkPaused = 3,
}

/**
 * PoE Input Status (field: poe)
 */
export enum PoEInStatus {
  /** PoE input is off */
  Off = 0,
  /** PoE input is on */
  On = 1,
}

/**
 * Port Speed values (field: spd)
 */
export enum Speed {
  /** 10 Megabit */
  Speed10M = 0,
  /** 100 Megabit */
  Speed100M = 1,
  /** 1 Gigabit */
  Speed1G = 2,
  /** 10 Gigabit */
  Speed10G = 3,
  /** 5 Gigabit */
  Speed5G = 4,
  /** 2.5 Gigabit */
  Speed2_5G = 5,
  /** 40 Gigabit */
  Speed40G = 6,
}

/**
 * Duplex Mode (field: dpx)
 */
export enum DuplexMode {
  /** Half duplex */
  Half = 0,
  /** Full duplex */
  Full = 1,
}

/**
 * Flow Control status (field: tfct)
 */
export enum FlowControl {
  /** Flow control disabled */
  Off = 0,
  /** Transmit only */
  TxOnly = 1,
  /** Receive only */
  RxOnly = 2,
  /** Both transmit and receive */
  On = 3,
}

/**
 * Cable Test - Last Hop status (field: hops)
 */
export enum LastHopStatus {
  /** No information */
  Unknown = 0,
  /** Link is OK */
  LinkOk = 1,
  /** No link detected */
  NoLink = 2,
}

/**
 * Cable Pair status (field: pair)
 */
export enum CablePairStatus {
  /** Normal - no issues */
  Normal = 0,
  /** Short circuit detected */
  Short = 1,
  /** Open circuit detected */
  Open = 2,
  /** Reversed polarity */
  ReversedPolarity = 3,
}

/**
 * RSTP/STP Protocol Mode (field: rstp)
 */
export enum RstpMode {
  /** Spanning Tree Protocol (802.1D) */
  STP = 0,
  /** Rapid Spanning Tree Protocol (802.1w) */
  RSTP = 1,
}

/**
 * RSTP Port Role (field: role)
 */
export enum RstpRole {
  Disabled = 'disabled',
  Alternate = 'alternate',
  Root = 'root',
  Designated = 'designated',
  Backup = 'backup',
}

/**
 * RSTP Port Type (field: p2p)
 */
export enum RstpPortType {
  /** Shared medium (hub) */
  Shared = 0,
  /** Point-to-point connection */
  PointToPoint = 1,
  /** Edge port (end device) */
  Edge = 2,
  /** Edge port (alternative value) */
  EdgeAlt = 3,
}

/**
 * RSTP Port State (field: lrn)
 */
export enum RstpState {
  Discarding = 'discarding',
  Learning = 'learning',
  Forwarding = 'forwarding',
}

/**
 * PoE Output Status (field: poes)
 */
export enum PoEOutStatus {
  /** Waiting for load to be connected */
  WaitingForLoad = 0,
  /** Powered on and delivering power */
  PoweredOn = 1,
  /** Overload condition detected */
  Overload = 2,
  /** No load detected */
  NoLoad = 3,
  /** Powered on (alternative state) */
  PoweredOnAlt = 4,
  /** Overload (alternative state) */
  OverloadAlt = 5,
  /** No load (alternative state) */
  NoLoadAlt = 6,
  /** Has load connected */
  HasLoad = 7,
  /** Invalid load detected */
  InvalidLoad = 8,
}

/**
 * Power Supply Unit Status (field: p1s, p2s)
 */
export enum PSUStatus {
  /** PSU has failed */
  Failed = 0,
  /** PSU is operating normally */
  Ok = 1,
}

/**
 * Combo Port Mode (field: cm)
 */
export enum ComboMode {
  Auto = 'auto',
  Copper = 'copper',
  SFP = 'sfp',
}

/**
 * QSFP Port Type (field: qtyp)
 */
export enum QSFPType {
  Auto = 'auto',
  Speed40G = '40G',
  Speed4x10G = '4x10G',
}

/**
 * Speed Control options (field: spdc)
 */
export enum SpeedControl {
  Speed10M = '10M',
  Speed100M = '100M',
  Speed1G = '1G',
}

/**
 * LACP Mode (field: mode)
 */
export enum LACPMode {
  Passive = 'passive',
  Active = 'active',
  Static = 'static',
}

/**
 * RSTP Port Cost Mode (field: cost)
 */
export enum PortCostMode {
  Short = 'short',
  Long = 'long',
}

/**
 * IP Address Acquisition Type (field: iptp)
 */
export enum AddressAcquisition {
  DHCPWithFallback = 'DHCP with fallback',
  Static = 'static',
  DHCPOnly = 'DHCP only',
}

/**
 * PoE Output Mode (field: poe in sys.b)
 */
export enum PoEOutMode {
  AutoOn = 'auto on',
  ForceOn = 'force on',
  Off = 'off',
}

/**
 * VLAN Mode (field: vlan)
 */
export enum VLANMode {
  Disabled = 'disabled',
  Optional = 'optional',
  Enabled = 'enabled',
  Strict = 'strict',
}

/**
 * VLAN Receive Mode (field: vlni)
 */
export enum VLANReceive {
  Any = 'any',
  OnlyTagged = 'only tagged',
  OnlyUntagged = 'only untagged',
}

/**
 * ACL VLAN Tag Match (field: vtag)
 */
export enum VLANTagMatch {
  Any = 'any',
  Present = 'present',
  NotPresent = 'not present',
}

/**
 * Helper function to get the display label for a LinkStatus value
 */
export function getLinkStatusLabel(status: LinkStatus): string {
  const labels = ['no link', 'link on', 'no link', 'link paused']
  return labels[status] || 'unknown'
}

/**
 * Helper function to get the display label for a Speed value
 */
export function getSpeedLabel(speed: Speed): string {
  const labels = ['10M', '100M', '1G', '10G', '5G', '2.5G', '40G']
  return labels[speed] || 'unknown'
}

/**
 * Helper function to get the display label for a PoEOutStatus value
 */
export function getPoEOutStatusLabel(status: PoEOutStatus): string {
  const labels = [
    'waiting for load',
    'powered on',
    'overload',
    'no load',
    'powered on',
    'overload',
    'no load',
    'has load',
    'invalid load',
  ]
  return labels[status] || 'unknown'
}
