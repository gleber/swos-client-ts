import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import type { RstpRequest } from '../../types/requests.js'
import type { RawRstpStatus, Rstp, RstpPort } from '../../types/rstp.js'
import { fixJson, hexToBoolArray, parseHexInt, toMikrotik } from '../../utils/parsers.js'
import type { Page } from '../page.interface.js'
import type { SwOSClient } from '../swos-client.js'

/**
 * Handles the 'RSTP' (Rapid Spanning Tree Protocol) tab of SwOS.
 * Endpoint: /rstp.b
 */
export class RstpPage implements Page<Rstp> {
  private numPorts = 0

  constructor(private client: SwOSClient) { }

  /**
   * Loads RSTP configuration and status.
   * Maps SwOS JSON keys:
   * - ena -> enabled (global boolean/bitmask?) - typically global enable on SwOS
   * - role -> role (array of port roles)
   * - lrn -> status (learning status bitmask?)
   * - cst -> path cost
   * - prio -> priority
   * - pid -> port ID
   */
  async load(): Promise<Either<Rstp, SwOSError>> {
    return (await this.client.fetch('/rstp.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawRstpStatus = JSON.parse(fixed)
        this.numPorts = raw.role.length

        const enabled = parseHexInt(raw.ena) !== 0
        const status = raw.lrn ? hexToBoolArray(raw.lrn, this.numPorts).map((s) => (s ? 1 : 0)) : []
        const role = raw.role.map((r) => parseHexInt(r))
        const cost = raw.cst.map((c) => parseHexInt(c))

        const priority = raw.prio ? raw.prio.map((p: string) => parseHexInt(p)) : []
        const portId = raw.pid ? raw.pid.map((p: string) => parseHexInt(p)) : []

        const ports: RstpPort[] = Array.from({ length: this.numPorts }, (_, i) => ({
          role: role[i] || 0,
          status: status[i] || 0,
          priority: priority[i] || 0,
          cost: cost[i] || 0,
          portId: portId[i] || 0,
        }))

        const rstp: Rstp = {
          enabled,
          ports,
        }
        return Either.result(rstp)
      } catch (e) {
        return Either.error(
          new SwOSError(`RSTP load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'} `)
        )
      }
    })
  }

  async save(rstp: Rstp): Promise<Either<void, SwOSError>> {
    const change = this.store(rstp)
    const postResult = await this.client.post('/rstp.b', toMikrotik(change))
    if (postResult.isError()) return Either.error(postResult.getError())

    return (await this.load()).map(() => undefined)
  }

  private store(rstp: Rstp): RstpRequest {
    let ena = 0;
    if (rstp.enabled) {
      ena = (1 << this.numPorts) - 1;
    }

    return {
      ena,
    };
  }
}
