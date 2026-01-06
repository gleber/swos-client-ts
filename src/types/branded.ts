import { Schema } from 'effect'

/**
 * Branded type for IP addresses.
 * Validates IPv4 format at runtime.
 */
export const IpAddress = Schema.String.pipe(
  Schema.pattern(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/),
  Schema.brand('IpAddress')
)
export type IpAddress = Schema.Schema.Type<typeof IpAddress>

/**
 * Branded type for MAC addresses.
 * Validates MAC format (colon-separated hex pairs) at runtime.
 */
export const MacAddress = Schema.String.pipe(
  Schema.pattern(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/),
  Schema.brand('MacAddress')
)
export type MacAddress = Schema.Schema.Type<typeof MacAddress>
