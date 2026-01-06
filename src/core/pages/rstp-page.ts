import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import type { RawRstpStatus, Rstp, RstpPort } from '../../types/rstp.js'
import { fixJson, hexToBoolArray, parseHexInt } from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class RstpPage {
  private client: SwOSClient

  constructor(client: SwOSClient) {
    this.client = client
  }

  async load(): Promise<Either<Rstp, SwOSError>> {
    return (await this.client.fetch('/rstp.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawRstpStatus = JSON.parse(fixed)
        const numPorts = raw.role.length

        const enabled = parseHexInt(raw.ena) !== 0
        const status = raw.lrn ? hexToBoolArray(raw.lrn, numPorts).map((s) => (s ? 1 : 0)) : [] // assuming lrn is learning status
        const role = raw.role.map((r) => parseHexInt(r))
        const cost = raw.cst.map((c) => parseHexInt(c))

        // Handling possibly missing arrays
        const priority = raw.prio ? raw.prio.map((p: string) => parseHexInt(p)) : []
        const portId = raw.pid ? raw.pid.map((p: string) => parseHexInt(p)) : []

        const ports: RstpPort[] = []
        for (let i = 0; i < numPorts; i++) {
          ports.push({
            role: role[i] || 0,
            status: status[i] || 0,
            priority: priority[i] || 0,
            cost: cost[i] || 0,
            portId: portId[i] || 0,
          })
        }

        const rstp: Rstp = {
          enabled,
          ports,
        }
        return Either.result(rstp)
      } catch (e) {
        return Either.error(
          new SwOSError(`RSTP load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`)
        )
      }
    })
  }
}
