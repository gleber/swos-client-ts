import { describe, expect, it } from 'vitest'
import { CablePairStatus, LastHopStatus } from '../types/mikrotik-fields.js'
import {
  toAddressAcquisition,
  toCablePairStatus,
  toComboMode,
  toLACPMode,
  toLastHopStatus,
  toPoEOutMode,
  toQSFPType,
  toVLANMode,
  toVLANReceive,
  toVLANTagMatch,
} from '../utils/parsers.js'

describe('Mikrotik Parsers', () => {
  it('should convert combo mode', () => {
    expect(toComboMode(0)).toBe('auto')
    expect(toComboMode(1)).toBe('copper')
    expect(toComboMode(2)).toBe('sfp')
    expect(toComboMode(99)).toBe('auto')
  })

  it('should convert QSFP type', () => {
    expect(toQSFPType(0)).toBe('auto')
    expect(toQSFPType(1)).toBe('40G')
    expect(toQSFPType(2)).toBe('4x10G')
    expect(toQSFPType(99)).toBe('auto')
  })

  it('should convert LACP mode', () => {
    expect(toLACPMode(0)).toBe('passive')
    expect(toLACPMode(1)).toBe('active')
    expect(toLACPMode(2)).toBe('static')
    expect(toLACPMode(99)).toBe('passive')
  })

  it('should convert address acquisition', () => {
    expect(toAddressAcquisition(0)).toBe('DHCP with fallback')
    expect(toAddressAcquisition(1)).toBe('static')
    expect(toAddressAcquisition(2)).toBe('DHCP only')
    expect(toAddressAcquisition(99)).toBe('DHCP with fallback')
  })

  it('should convert PoE out mode', () => {
    expect(toPoEOutMode(0)).toBe('auto on')
    expect(toPoEOutMode(1)).toBe('force on')
    expect(toPoEOutMode(2)).toBe('off')
    expect(toPoEOutMode(99)).toBe('auto on')
  })

  it('should convert VLAN mode', () => {
    expect(toVLANMode(0)).toBe('disabled')
    expect(toVLANMode(1)).toBe('optional')
    expect(toVLANMode(2)).toBe('enabled')
    expect(toVLANMode(3)).toBe('strict')
    expect(toVLANMode(99)).toBe('disabled')
  })

  it('should convert VLAN receive', () => {
    expect(toVLANReceive(0)).toBe('any')
    expect(toVLANReceive(1)).toBe('only tagged')
    expect(toVLANReceive(2)).toBe('only untagged')
    expect(toVLANReceive(99)).toBe('any')
  })

  it('should convert VLAN tag match', () => {
    expect(toVLANTagMatch(0)).toBe('any')
    expect(toVLANTagMatch(1)).toBe('present')
    expect(toVLANTagMatch(2)).toBe('not present')
    expect(toVLANTagMatch(99)).toBe('any')
  })

  it('should convert last hop status', () => {
    expect(toLastHopStatus(0)).toBe(LastHopStatus.Unknown)
    expect(toLastHopStatus(1)).toBe(LastHopStatus.LinkOk)
    expect(toLastHopStatus(2)).toBe(LastHopStatus.NoLink)
    expect(toLastHopStatus(99)).toBe(LastHopStatus.Unknown)
  })

  it('should convert cable pair status', () => {
    expect(toCablePairStatus(0)).toBe(CablePairStatus.Normal)
    expect(toCablePairStatus(1)).toBe(CablePairStatus.Short)
    expect(toCablePairStatus(2)).toBe(CablePairStatus.Open)
    expect(toCablePairStatus(3)).toBe(CablePairStatus.ReversedPolarity)
    expect(toCablePairStatus(99)).toBe(CablePairStatus.Normal)
  })
})
