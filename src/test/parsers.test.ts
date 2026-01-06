import { describe, expect, it } from 'vitest'
import {
  boolArrayToHex,
  fixJson,
  hexToBoolArray,
  hexToMac,
  hexToString,
  intToIp,
  ipToInt,
  parseHexInt,
  stringToHex,
  toMikrotik,
} from '../utils/parsers.js'

describe('parsers', () => {
  describe('fixJson', () => {
    it('should quote unquoted keys and values', () => {
      const input = '{en:0x3f,lnk:0x1e}'
      const expected = '{"en":"0x3f","lnk":"0x1e"}'
      expect(fixJson(input)).toBe(expected)
    })

    it('should handle mixed quoted and unquoted', () => {
      const input = '{"en":0x3f,lnk:0x1e}'
      const expected = '{"en":"0x3f","lnk":"0x1e"}'
      expect(fixJson(input)).toBe(expected)
    })

    it('should handle arrays', () => {
      const input = '{role:[0x3,0x3]}'
      const expected = '{"role":["0x3","0x3"]}'
      expect(fixJson(input)).toBe(expected)
    })

    it('should quote non-hex values', () => {
      const input = '{mac:085531001b19}'
      const expected = '{"mac":"085531001b19"}'
      expect(fixJson(input)).toBe(expected)
    })

    it('should handle empty values', () => {
      const input = '{ven:,pn:}'
      const expected = '{"ven":"","pn":""}'
      expect(fixJson(input)).toBe(expected)
    })
  })

  describe('hexToBoolArray', () => {
    it('should convert hex to boolean array', () => {
      expect(hexToBoolArray('0x3f', 6)).toEqual([true, true, true, true, true, true])
      expect(hexToBoolArray('0x1e', 6)).toEqual([false, true, true, true, true, false])
    })
  })

  describe('hexToString', () => {
    it('should decode hex string', () => {
      expect(hexToString('6f66666963652d726f75746572')).toBe('office-router')
    })
  })

  describe('parseHexInt', () => {
    it('should parse hex string to int', () => {
      expect(parseHexInt('0x3f')).toBe(63)
      expect(parseHexInt('0x1')).toBe(1)
    })
  })

  describe('hexToMac', () => {
    it('should convert hex to MAC address', () => {
      expect(hexToMac('085531001b19')).toBe('08:55:31:00:1b:19')
    })
  })

  describe('intToIp', () => {
    it('should convert int to IP', () => {
      expect(intToIp(3232235776)).toBe('0.1.168.192')
    })
  })

  describe('toMikrotik', () => {
    it('should encode string for Mikrotik', () => {
      expect(toMikrotik('test')).toBe("'test'")
    })
  })

  describe('stringToHex', () => {
    it('should convert string to hex', () => {
      expect(stringToHex('test')).toBe('74657374')
    })
  })

  describe('ipToInt', () => {
    it('should convert IP to int', () => {
      expect(ipToInt('192.168.1.0')).toBe(-1062731520)
    })
  })

  describe('boolArrayToHex', () => {
    it('should convert boolean array to hex', () => {
      expect(boolArrayToHex([true, true, true, true, true, true])).toBe('0x3F')
      expect(boolArrayToHex([false, true, true, true, true, false])).toBe('0x1E')
    })
  })
})
