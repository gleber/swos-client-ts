/**
 * Fixes malformed JSON returned by SwOS.
 * SwOS APIs often return invalid JSON (unquoted keys, hex values with '0x', single quotes).
 * This function sanitizes the string to be valid JSON.
 *
 * @param input - The raw response string from SwOS
 * @returns A valid JSON string
 */
export function fixJson(input: string): string {
  // Replace quotes
  let json = input.replace(/[`']/g, '"')
  // Remove spaces after :
  json = json.replace(/:\s+/g, ':')
  // Replace unquoted keys with quoted
  json = json.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  // Quote hex values
  json = json.replace(/:(\s*)(0x[0-9a-fA-F]+)/g, ':$1"$2"')
  json = json.replace(/(0x[0-9a-fA-F]+)(?=[,\]\}])/g, '"$1"')
  // Quote other unquoted values
  json = json.replace(/:(\s*)([^",\[\]{}\s]*)(?=[,\]\}])/g, ':$1"$2"')
  // Replace single quotes with double quotes
  json = json.replace(/'/g, '"')
  return json
}

/**
 * Converts a hex string to an ASCII string.
 */
export function hexToString(hex: string): string {
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(Number.parseInt(hex.substr(i, 2), 16))
  }
  return str
}

/**
 * Converts an ASCII string to a hex string.
 */
export function stringToHex(str: string): string {
  let hex = ''
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return hex
}

/**
 * Converts a hex string bitmask to a boolean array.
 * Used for port flags where each bit represents a port.
 *
 * @param hex - Hex string (e.g., '0x3F')
 * @param length - Number of bits/ports to read (default should match port count)
 * @returns Array of booleans [port0, port1, ...]
 */
export function hexToBoolArray(hex: string, length: number): boolean[] {
  const num = Number.parseInt(hex, 16)
  const arr = []
  for (let i = 0; i < length; i++) {
    arr.push((num & (1 << i)) !== 0)
  }
  return arr
}

/**
 * Converts a boolean array to a hex string bitmask.
 * Used for saving port flags.
 *
 * @param arr - Array of booleans [port0, port1, ...]
 * @returns Hex string (e.g., '0x3F')
 */
export function boolArrayToHex(arr: boolean[]): string {
  let num = 0
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      num |= 1 << i
    }
  }
  return `0x${num.toString(16).toUpperCase()}`
}

/**
 * Parses a hex string into a number.
 *
 * @param hex - Hex string (e.g., '0x1A')
 * @returns Number
 */
export function parseHexInt(hex: string): number {
  return Number.parseInt(hex, 16)
}

/**
 * Converts a number to a hex string format '0x...'.
 *
 * @param num - Input number
 * @returns Hex string
 */
export function intToHex(num: number): string {
  return `0x${num.toString(16).toUpperCase()}`
}

/**
 * Converts a 32-bit integer to an IP address string (Little Endian).
 * SwOS often behaves with LE byte order for IPs in certain contexts.
 *
 * @param num - 32-bit integer
 * @returns IP string "192.168.1.1"
 */
export function intToIp(num: number): string {
  // Device sends IPs in little-endian byte order
  const b1 = num & 255
  const b2 = (num >>> 8) & 255
  const b3 = (num >>> 16) & 255
  const b4 = (num >>> 24) & 255
  return [b1, b2, b3, b4].join('.')
}

/**
 * Converts an IP address string to a 32-bit integer (Big Endian).
 * Standard network byte order.
 *
 * @param ip - IP string "192.168.1.1"
 * @returns 32-bit integer
 */
export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number)
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
}

/**
 * Converts an IP address string to a 32-bit integer (Little Endian).
 * Used when sending IPs to SwOS text API which expects LE integers.
 *
 * @param ip - IP string "192.168.1.1"
 * @returns 32-bit integer (LE)
 */
export function ipToIntLE(ip: string): number {
  const parts = ip.split('.').map(Number)
  return parts[0] | (parts[1] << 8) | (parts[2] << 16) | (parts[3] << 24)
}

/**
 * Formats a hex string as a MAC address.
 *
 * @param hex - Raw hex string "001122334455"
 * @returns MAC format "00:11:22:33:44:55"
 */
export function hexToMac(hex: string): string {
  return hex.match(/.{1,2}/g)?.join(':') || ''
}

/**
 * Removes separators from a MAC address to get a raw hex string.
 *
 * @param mac - MAC address "00:11:22:33:44:55"
 * @returns Hex string "001122334455"
 */
export function macToHex(mac: string): string {
  return mac.replace(/:/g, '')
}

/**
 * Serializes a JavaScript object into the specific format expected by SwOS POST requests.
 * SwOS doesn't accept standard JSON. It expects:
 * - Arrays as `[val1,val2]`
 * - Objects as `{key:value}` (unquoted keys, specific value formats)
 * - Numbers as `0xHEX`
 *
 * @param obj - The object to serialize
 * @returns SwOS-compatible string
 */
export function toMikrotik(obj: unknown): string {
  if (Array.isArray(obj)) {
    return `[${obj.map(toMikrotik).join(',')}]`
  }
  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj as Record<string, unknown>).map(
      ([key, value]) => `${key}:${toMikrotik(value)}`
    )
    return `{${entries.join(',')}}`
  }
  if (typeof obj === 'number') {
    return `0x${obj.toString(16).toUpperCase()}`
  }
  if (typeof obj === 'boolean') {
    return obj ? '0x01' : '0x00'
  }
  if (typeof obj === 'string') {
    return `'${obj}'`
  }
  throw new Error('Unsupported type for toMikrotik')
}

// ===== Enum Converters =====

import { LinkSpeed, PoeMode, PoeStatus } from '../types/link.js'
import { VlanPortMode } from '../types/vlan.js'

/**
 * Converts SwOS numeric link speed value to string enum.
 */
export function toLinkSpeed(value: number): LinkSpeed {
  const map: Record<number, LinkSpeed> = {
    0: LinkSpeed.Speed10M,
    1: LinkSpeed.Speed100M,
    2: LinkSpeed.Speed1G,
    7: LinkSpeed.Unavailable,
  }
  return map[value] ?? LinkSpeed.Unavailable
}

/**
 * Converts link speed string enum to SwOS numeric value.
 */
export function fromLinkSpeed(speed: LinkSpeed): number {
  const map: Record<LinkSpeed, number> = {
    [LinkSpeed.Speed10M]: 0x00,
    [LinkSpeed.Speed100M]: 0x01,
    [LinkSpeed.Speed1G]: 0x02,
    [LinkSpeed.Unavailable]: 0x07,
  }
  return map[speed]
}

/**
 * Converts SwOS numeric PoE mode value to string enum.
 */
export function toPoeMode(value: number): PoeMode {
  const map: Record<number, PoeMode> = {
    0: PoeMode.Off,
    1: PoeMode.Auto,
    2: PoeMode.On,
    3: PoeMode.Calib,
  }
  return map[value] ?? PoeMode.Off
}

/**
 * Converts PoE mode string enum to SwOS numeric value.
 */
export function fromPoeMode(mode: PoeMode): number {
  const map: Record<PoeMode, number> = {
    [PoeMode.Off]: 0,
    [PoeMode.Auto]: 1,
    [PoeMode.On]: 2,
    [PoeMode.Calib]: 3,
  }
  return map[mode]
}

/**
 * Converts SwOS numeric PoE status value to string enum.
 */
export function toPoeStatus(value: number): PoeStatus {
  const map: Record<number, PoeStatus> = {
    0: PoeStatus.Unavailable,
    1: PoeStatus.Disabled,
    2: PoeStatus.WaitingForLoad,
    3: PoeStatus.Active,
  }
  return map[value] ?? PoeStatus.Unavailable
}

/**
 * Converts PoE status string enum to SwOS numeric value.
 */
export function fromPoeStatus(status: PoeStatus): number {
  const map: Record<PoeStatus, number> = {
    [PoeStatus.Unavailable]: 0,
    [PoeStatus.Disabled]: 1,
    [PoeStatus.WaitingForLoad]: 2,
    [PoeStatus.Active]: 3,
  }
  return map[status]
}

/**
 * Converts SwOS numeric VLAN port mode value to string enum.
 */
export function toVlanPortMode(value: number): VlanPortMode {
  const map: Record<number, VlanPortMode> = {
    0: VlanPortMode.LeaveAsIs,
    1: VlanPortMode.AlwaysStrip,
    2: VlanPortMode.AddIfMissing,
    3: VlanPortMode.NotAMember,
  }
  return map[value] ?? VlanPortMode.LeaveAsIs
}

/**
 * Converts VLAN port mode string enum to SwOS numeric value.
 */
export function fromVlanPortMode(mode: VlanPortMode): number {
  const map: Record<VlanPortMode, number> = {
    [VlanPortMode.LeaveAsIs]: 0,
    [VlanPortMode.AlwaysStrip]: 1,
    [VlanPortMode.AddIfMissing]: 2,
    [VlanPortMode.NotAMember]: 3,
  }
  return map[mode]
}

// ===== New Enum Converters (from mikrotik-fields.ts) =====

import {
  AddressAcquisition,
  CablePairStatus,
  ComboMode,
  DuplexMode,
  FlowControl,
  LACPMode,
  LastHopStatus,
  LinkStatus,
  PSUStatus,
  PoEOutMode,
  PoEOutStatus,
  PortCostMode,
  QSFPType,
  RstpMode,
  RstpPortType,
  RstpRole,
  RstpState,
  SpeedControl,
  VLANMode,
  VLANReceive,
  VLANTagMatch,
} from '../types/mikrotik-fields.js'

/**
 * Converts SwOS numeric link status value to enum.
 */
export function toLinkStatus(value: number): LinkStatus {
  const map: Record<number, LinkStatus> = {
    0: LinkStatus.NoLink,
    1: LinkStatus.LinkOn,
    2: LinkStatus.NoLinkAlt,
    3: LinkStatus.LinkPaused,
  }
  return map[value] ?? LinkStatus.NoLink
}

export function fromLinkStatus(status: LinkStatus): number {
  return status
}

/**
 * Converts SwOS numeric duplex value to enum.
 */
export function toDuplexMode(value: number): DuplexMode {
  return value === 0 ? DuplexMode.Half : DuplexMode.Full
}

export function fromDuplexMode(mode: DuplexMode): number {
  return mode
}

/**
 * Converts SwOS numeric flow control value to enum.
 */
export function toFlowControl(value: number): FlowControl {
  const map: Record<number, FlowControl> = {
    0: FlowControl.Off,
    1: FlowControl.TxOnly,
    2: FlowControl.RxOnly,
    3: FlowControl.On,
  }
  return map[value] ?? FlowControl.Off
}

export function fromFlowControl(fc: FlowControl): number {
  return fc
}

/**
 * Converts SwOS numeric RSTP mode value to enum.
 */
export function toRstpMode(value: number): RstpMode {
  return value === 0 ? RstpMode.STP : RstpMode.RSTP
}

export function fromRstpMode(mode: RstpMode): number {
  return mode
}

/**
 * Converts SwOS numeric RSTP role value to enum.
 */
export function toRstpRole(value: number): RstpRole {
  const map: Record<number, RstpRole> = {
    0: RstpRole.Disabled,
    1: RstpRole.Alternate,
    2: RstpRole.Root,
    3: RstpRole.Designated,
    4: RstpRole.Backup,
  }
  return map[value] ?? RstpRole.Disabled
}

export function fromRstpRole(role: RstpRole): number {
  const map: Record<RstpRole, number> = {
    [RstpRole.Disabled]: 0,
    [RstpRole.Alternate]: 1,
    [RstpRole.Root]: 2,
    [RstpRole.Designated]: 3,
    [RstpRole.Backup]: 4,
  }
  return map[role]
}

/**
 * Converts SwOS numeric RSTP port type value to enum.
 */
export function toRstpPortType(value: number): RstpPortType {
  const map: Record<number, RstpPortType> = {
    0: RstpPortType.Shared,
    1: RstpPortType.PointToPoint,
    2: RstpPortType.Edge,
    3: RstpPortType.EdgeAlt,
  }
  return map[value] ?? RstpPortType.Shared
}

export function fromRstpPortType(portType: RstpPortType): number {
  return portType
}

/**
 * Converts SwOS numeric RSTP state value to enum.
 */
export function toRstpState(value: number): RstpState {
  const map: Record<number, RstpState> = {
    0: RstpState.Discarding,
    1: RstpState.Learning,
    2: RstpState.Forwarding,
    3: RstpState.Forwarding,
  }
  return map[value] ?? RstpState.Discarding
}

export function fromRstpState(state: RstpState): number {
  const map: Record<RstpState, number> = {
    [RstpState.Discarding]: 0,
    [RstpState.Learning]: 1,
    [RstpState.Forwarding]: 2, // Defaulting to 2 for forwarding
  }
  return map[state]
}

/**
 * Converts SwOS numeric PoE output status value to enum.
 */
export function toPoEOutStatus(value: number): PoEOutStatus {
  const map: Record<number, PoEOutStatus> = {
    0: PoEOutStatus.WaitingForLoad,
    1: PoEOutStatus.PoweredOn,
    2: PoEOutStatus.Overload,
    3: PoEOutStatus.NoLoad,
    4: PoEOutStatus.PoweredOnAlt,
    5: PoEOutStatus.OverloadAlt,
    6: PoEOutStatus.NoLoadAlt,
    7: PoEOutStatus.HasLoad,
    8: PoEOutStatus.InvalidLoad,
  }
  return map[value] ?? PoEOutStatus.WaitingForLoad
}

export function fromPoEOutStatus(status: PoEOutStatus): number {
  return status
}

/**
 * Converts SwOS numeric PSU status value to enum.
 */
export function toPSUStatus(value: number): PSUStatus {
  return value === 0 ? PSUStatus.Failed : PSUStatus.Ok
}

export function fromPSUStatus(status: PSUStatus): number {
  return status
}

/**
 * Converts SwOS numeric combo mode value to string type.
 */
export function toComboMode(value: number): ComboMode {
  const modes: ComboMode[] = [ComboMode.Auto, ComboMode.Copper, ComboMode.SFP]
  return modes[value] ?? ComboMode.Auto
}

/**
 * Converts SwOS numeric QSFP type value to string type.
 */
export function toQSFPType(value: number): QSFPType {
  const types: QSFPType[] = [QSFPType.Auto, QSFPType.Speed40G, QSFPType.Speed4x10G]
  return types[value] ?? QSFPType.Auto
}

/**
 * Converts SwOS numeric LACP mode value to string type.
 */
export function toLACPMode(value: number): LACPMode {
  const modes: LACPMode[] = [LACPMode.Passive, LACPMode.Active, LACPMode.Static]
  return modes[value] ?? LACPMode.Passive
}

/**
 * Converts SwOS numeric address acquisition value to string type.
 */
export function toAddressAcquisition(value: number): AddressAcquisition {
  const modes: AddressAcquisition[] = [AddressAcquisition.DHCPWithFallback, AddressAcquisition.Static, AddressAcquisition.DHCPOnly]
  return modes[value] ?? AddressAcquisition.DHCPWithFallback
}

/**
 * Converts SwOS numeric PoE out mode value to string type.
 */
export function toPoEOutMode(value: number): PoEOutMode {
  const modes: PoEOutMode[] = [PoEOutMode.AutoOn, PoEOutMode.ForceOn, PoEOutMode.Off]
  return modes[value] ?? PoEOutMode.AutoOn
}

/**
 * Converts SwOS numeric VLAN mode value to string type.
 */
export function toVLANMode(value: number): VLANMode {
  const modes: VLANMode[] = [VLANMode.Disabled, VLANMode.Optional, VLANMode.Enabled, VLANMode.Strict]
  return modes[value] ?? VLANMode.Disabled
}

/**
 * Converts SwOS numeric VLAN receive value to string type.
 */
export function toVLANReceive(value: number): VLANReceive {
  const modes: VLANReceive[] = [VLANReceive.Any, VLANReceive.OnlyTagged, VLANReceive.OnlyUntagged]
  return modes[value] ?? VLANReceive.Any
}

/**
 * Converts SwOS numeric VLAN tag match value to string type.
 */
export function toVLANTagMatch(value: number): VLANTagMatch {
  const modes: VLANTagMatch[] = [VLANTagMatch.Any, VLANTagMatch.Present, VLANTagMatch.NotPresent]
  return modes[value] ?? VLANTagMatch.Any
}

/**
 * Converts SwOS numeric last hop status value to string type.
 */
export function toLastHopStatus(value: number): LastHopStatus {
  const map: Record<number, LastHopStatus> = {
    0: LastHopStatus.Unknown,
    1: LastHopStatus.LinkOk,
    2: LastHopStatus.NoLink,
  }
  return map[value] ?? LastHopStatus.Unknown
}

/**
 * Converts SwOS numeric cable pair status value to string type.
 */
export function toCablePairStatus(value: number): CablePairStatus {
  const map: Record<number, CablePairStatus> = {
    0: CablePairStatus.Normal,
    1: CablePairStatus.Short,
    2: CablePairStatus.Open,
    3: CablePairStatus.ReversedPolarity,
  }
  return map[value] ?? CablePairStatus.Normal
}

/**
 * Converts SwOS numeric speed control value to string type.
 */
export function toSpeedControl(value: number): SpeedControl {
  const modes: SpeedControl[] = [SpeedControl.Speed10M, SpeedControl.Speed100M, SpeedControl.Speed1G]
  return modes[value] ?? SpeedControl.Speed1G
}

/**
 * Converts SwOS numeric port cost mode value to string type.
 */
export function toPortCostMode(value: number): PortCostMode {
  const modes: PortCostMode[] = [PortCostMode.Short, PortCostMode.Long]
  return modes[value] ?? PortCostMode.Short
}

// ===== Branded Type Constructors =====

import { Schema } from 'effect'
import { IpAddress, MacAddress } from '../types/branded.js'

/**
 * Creates a branded IpAddress from a string.
 * Validates the format and throws if invalid.
 */
export function createIpAddress(value: string): IpAddress {
  return Schema.decodeUnknownSync(IpAddress)(value)
}

/**
 * Creates a branded MacAddress from a string.
 * Validates the format and throws if invalid.
 */
export function createMacAddress(value: string): MacAddress {
  return Schema.decodeUnknownSync(MacAddress)(value)
}
