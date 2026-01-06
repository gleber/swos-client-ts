export function fixJson(json: string): string {
  // Replace unquoted keys with quoted
  json = json.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  // Replace single quotes with double quotes
  json = json.replace(/'/g, '"');
  return json;
}

export function hexToBoolArray(hex: string, length: number): boolean[] {
  const num = parseInt(hex, 16);
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push((num & (1 << i)) !== 0);
  }
  return arr;
}

export function boolArrayToHex(arr: boolean[]): string {
  let num = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      num |= 1 << i;
    }
  }
  return '0x' + num.toString(16).toUpperCase();
}

export function hexToString(hex: string): string {
  const bytes = hex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
  return Buffer.from(bytes).toString('utf8');
}

export function stringToHex(str: string): string {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

export function parseHexInt(hex: string): number {
  return parseInt(hex, 16);
}

export function intToHex(num: number): string {
  return '0x' + num.toString(16).toUpperCase();
}

export function intToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

export function hexToMac(hex: string): string {
  return hex.match(/.{1,2}/g)?.join(':') || '';
}

export function macToHex(mac: string): string {
  return mac.replace(/:/g, '');
}

export function toMikrotik(obj: any): string {
  if (Array.isArray(obj)) {
    return '[' + obj.map(toMikrotik).join(',') + ']';
  }
  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj).map(([key, value]) => `${key}:${toMikrotik(value)}`);
    return '{' + entries.join(',') + '}';
  }
  if (typeof obj === 'number') {
    return '0x' + obj.toString(16).toUpperCase();
  }
  if (typeof obj === 'boolean') {
    return obj ? '0x01' : '0x00';
  }
  if (typeof obj === 'string') {
    return `'${obj}'`;
  }
  throw new Error('Unsupported type for toMikrotik');
}