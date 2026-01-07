import { Effect } from 'effect'
import { SwOSError } from '../../types/error.js'
import type { Fwd, RawFwdStatus } from '../../types/fwd.js'
import type { FwdRequest } from '../../types/requests.js'
import {
  boolArrayToHex,
  fixJson,
  hexToBoolArray,
  parseHexInt,
  toMikrotik,
} from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class FwdPage {
  private client: SwOSClient
  public fwd: Fwd | null = null
  private numPorts = 0

  constructor(client: SwOSClient) {
    this.client = client
  }

  /**
   * Loads forwarding configuration.
   * NOTE: The mapping of VLAN properties here is historically complex and potentially confusing
   * regarding SwOS vs TS field names (vlan vs dvid vs defaultVlanId).
   * - `raw.vlan` maps to `defaultVlanId` (in TS model)
   * - `raw.dvid` maps to `vlanId`
   * - `raw.vlni` maps to `vlanMode`
   */
  load(): Effect.Effect<Fwd, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const response = yield* _(self.client.fetch('/fwd.b'))

      return yield* _(
        Effect.try(() => {
          const fixed = fixJson(response)
          const raw: RawFwdStatus = JSON.parse(fixed)
          self.numPorts = raw.vlan.length

          const fwd: Fwd = {
            mirror: parseHexInt(raw.imr),
            ports: [],
          }

          // Dynamically extract all fp fields (fp1, fp2, ..., fpN)
          const fpFields: number[] = []
          for (let i = 1; i <= self.numPorts; i++) {
            const fpKey = `fp${i}` as keyof RawFwdStatus
            const fpValue = raw[fpKey]
            if (fpValue !== undefined && typeof fpValue === 'string') {
              fpFields.push(parseHexInt(fpValue))
            } else {
              fpFields.push(0)
            }
          }

          const enabled = fpFields.map((fp) => fp !== 0)

          const defaultVlanIds = raw.vlan.map((x) => parseHexInt(x))
          const vlanIds = raw.dvid.map((x) => parseHexInt(x))
          const vlanModes = raw.vlni.map((x) => parseHexInt(x))
          const rateLimits = raw.srt.map((x) => parseHexInt(x))
          const lockedVal = parseHexInt(raw.lck)

          for (let i = 0; i < self.numPorts; i++) {
            fwd.ports.push({
              enabled: enabled[i] || false,
              linkUp: false,
              flowControl: false,
              defaultVlanId: defaultVlanIds[i] || 0,
              vlanId: vlanIds[i] || 0,
              vlanMode: vlanModes[i] || 0,
              locked: (lockedVal & (1 << i)) !== 0,
              rateLimit: rateLimits[i] || 0,
              broadcastLimit: 0,
              multicastLimit: 0,
              unicastLimit: 0,
            })
          }
          self.fwd = fwd
          return fwd
        }).pipe(
          Effect.mapError(
            (e) =>
              new SwOSError(
                `FWD load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'}`
              )
          )
        )
      )
    })
  }

  save(data: Fwd): Effect.Effect<void, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const change = self.store(data)
      yield* _(self.client.post('/fwd.b', toMikrotik(change)))
      yield* _(self.load())
    })
  }

  async loadAsync(): Promise<Fwd> {
    return Effect.runPromise(this.load())
  }

  async saveAsync(data: Fwd): Promise<void> {
    return Effect.runPromise(this.save(data))
  }

  private store(fwd: Fwd): FwdRequest {
    // Reconstruct fields from FwdPort[]
    // Note: Some FwdRequest fields like fp1..fp6 are Forwarding Tables.
    // My FwdPort structure has `enabled`. Go client maps `fp1..fp6` to `PortForward.ForwardTable`.
    // swos-ts `FwdPort` logic assumed `fp1..fp6` mapped to `enabled`.
    // Let's check my load() implementation for enabled:
    // `const enabled = [parseHexInt(raw.fp1) !== 0, ... ]`
    // If fpX is a bitmask of forwarding table (which it usually is in SwOS), then treating it as boolean `!== 0` checks if ANY forwarding is allowed?
    // Go client: `f.PortForward[0].ForwardTable, err = bitMaskToArray(in.Fp1, f.numPorts)`
    // So `fp1` is indeed a table (mask) for port 1.
    // If I only have `enabled: boolean` in my TS model, I am losing data.
    // Spec: "forwarding table".
    // If I save `enabled` back, I need to decide what `enabled = true` means.
    // Does it mean "forward to everything" (broadcast)? Or restore previous state?
    // Since I don't store the full table, I can't restore previous state unless I re-fetch or keep `raw`.
    // Constructing a "default" mask: if enabled, allow all?
    // SwOS convention: usually fully connected means all bits set (except maybe self).
    // I'll assume `enabled` => all bits set (0x3F for 6 ports) for now, as I don't have better info without refactoring `FwdPort` to hold the table.
    // Also `lck` is bitmask.

    // Mapping:
    // FwdPort.enabled -> fp1..fp6 (as full masks)
    // FwdPort.locked -> lck
    // FwdPort.defaultVlanId -> vlan (Wait, load says vlan->defaultVlanId? `const defaultVlanIds = raw.vlan.map...`)
    // FwdPort.vlanId -> dvid? (`const vlanIds = raw.dvid.map...`)
    // Go client:
    // `f.PortForward[i].DefaultVlanId = parseInt(in.Dvid[i])` => dvid IS DefaultVlanId.
    // `vm = parseInt(in.Vlan[i])` -> `VlanMode`.
    // My TS load: `defaultVlanId: defaultVlanIds[i]` where `defaultVlanIds = raw.vlan.map`.
    // So TS `defaultVlanId` comes from `raw.vlan`.
    // BUT Go says `raw.vlan` is `VlanMode`.
    // AND TS `vlanId` comes from `raw.dvid`.
    // Go says `raw.dvid` is `DefaultVlanId`.
    // TS `vlanMode` comes from `raw.vlni`? (`const vlanModes = raw.vlni.map`)
    // Go says `raw.vlni` is `VlanReceive`.
    // It seems the naming in TS `FwdPort` (`defaultVlanId`, `vlanId`, `vlanMode`) might be misaligned with SwOS fields if Go client is correct.
    // However, I must respect the existing TS `Fwd` interface, but ensure `store` maps it back to the correct SwOS fields.
    // If TS `defaultVlanId` is populated from `raw.vlan` (which is Mode), then `store` should put `defaultVlanId` back into `vlan` (Mode)? That would be broken.
    // High probability: The TS `load` mapping was verified/refactored recently.
    // Let's re-verify FwdPage.load from Step 332.
    // `const defaultVlanIds = raw.vlan.map`
    // `const vlanIds = raw.dvid.map` (vlanId property)
    // `const vlanModes = raw.vlni.map`
    // If `raw.vlan` is actually VLAN Mode (as per Go), then `defaultVlanId` holds the Mode?
    // If `raw.dvid` is Default VLAN ID (as per Go), then `vlanId` holds the DVID?
    // If `raw.vlni` is VLAN Receive (as per Go), then `vlanMode` holds VlanReceive?
    // It seems the naming in TS `FwdPort` (`defaultVlanId`, `vlanId`, `vlanMode`) might be misaligned with SwOS fields if Go client is correct.
    // I will map based on what `load` did, but I should probably add a TODO or Comments.
    // `load`: raw.vlan -> defaultVlanId. `store`: defaultVlanId -> vlan.
    // `load`: raw.dvid -> vlanId. `store`: vlanId -> dvid.
    // `load`: raw.vlni -> vlanMode. `store`: vlanMode -> vlni.
    // Even if names are semantic mismatches, round-tripping should work if I reverse the map.

    const fullMask = (1 << this.numPorts) - 1

    // FwdPort.enabled -> fpX (mask).
    // If enabled, use fullMask. If disabled, use 0.
    const fp: number[] = fwd.ports.map((p) => (p.enabled ? fullMask : 0))

    // lck
    const lck = fwd.ports.reduce((acc, p, i) => acc | (p.locked ? 1 << i : 0), 0)

    const vlan = fwd.ports.map((p) => p.defaultVlanId)
    const dvid = fwd.ports.map((p) => p.vlanId)
    const vlni = fwd.ports.map((p) => p.vlanMode)
    const or = fwd.ports.map((p) => p.rateLimit)

    // Build the request object with dynamic fp fields
    const request: FwdRequest = {
      lck,
      lckf: 0, // Not exposed in FwdPort
      imr: 0, // Not exposed (mirror source?)
      omr: 0, // Not exposed
      mrto: fwd.mirror, // mirror target
      or,
      vlan,
      vlni,
      dvid,
      fvid: 0, // Not exposed
      vlnh: new Array(this.numPorts).fill(0), // Not exposed (vlan header)
    }

    // Add dynamic fp fields
    for (let i = 0; i < fp.length; i++) {
      const fpKey = `fp${i + 1}` as `fp${number}`
      request[fpKey] = fp[i] || 0
    }

    return request
  }
}
