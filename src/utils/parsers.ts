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
 * Converts a hex string to a UTF-8 string.
 * SwOS returns strings (likely identities, names) as hex.
 *
 * @param hex - Hex string
 * @returns Decoded string
 */
export function hexToString(hex: string): string {
  if (!hex || hex === '') return ''
  const bytes = hex.match(/.{1,2}/g)?.map((b) => Number.parseInt(b, 16)) || []
  return Buffer.from(bytes).toString('utf8')
}

/**
 * Converts a string to a hex string.
 * Used for sending string values (identities, names) to SwOS.
 *
 * @param str - Input string
 * @returns Hex string
 */
export function stringToHex(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
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
