export interface Snmp {
  enabled: boolean
  community: string
  contactInfo: string
  location: string
}

export interface RawSnmpStatus {
  en: string // Enabled
  com: string // Community
  ci: string // Contact Info
  loc: string // Location
}
