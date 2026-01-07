import type { LACPMode } from './mikrotik-fields.js'

export interface LagPort {
  mode: LACPMode
  group: string // grp (hex) - Trunk Group
  backupGroup: string // sgrp (hex) - Source Group / Backup? Let's check mikrotik-dump or assume logic.
  partnerMac: string // mac
}

export interface RawLagStatus {
  mode: string[] // Mode (passive, active, static)
  sgrp: string[] // Group
  grp: string[] // Trunk
  mac: string[] // Partner MAC
}
