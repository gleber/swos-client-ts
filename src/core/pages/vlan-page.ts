import { Either } from '../../types/either.js'
import { SwOSError } from '../../types/error.js'
import { VlanRequest } from '../../types/requests.js';
import { RawVlanStatus, Vlan, VlanPortMode } from '../../types/vlan.js'
import { fixJson, parseHexInt, toMikrotik } from '../../utils/parsers.js'
import type { SwOSClient } from '../swos-client.js'

export class VlanPage {
  private client: SwOSClient
  private numPorts = 0
  public vlans: Vlan[] = [];

  constructor(client: SwOSClient) {
    this.client = client
  }

  setNumPorts(numPorts: number) {
    this.numPorts = numPorts
  }

  async load(): Promise<Either<Vlan[], SwOSError>> {
    return (await this.client.fetch('/vlan.b')).flatMap((response) => {
      try {
        const fixed = fixJson(response)
        const raw: RawVlanStatus[] = JSON.parse(fixed)

        const vlans: Vlan[] = raw.map((r) => ({
          id: parseHexInt(r.vid),
          independentVlanLookup: parseHexInt(r.ivl) !== 0,
          igmpSnooping: parseHexInt(r.igmp) !== 0,
          portMode: r.prt.map((p) => parseHexInt(p) as VlanPortMode),
        }))
        this.vlans = vlans;
        return Either.result(vlans)
      } catch (e) {
        return Either.error(
          new SwOSError(`Vlan load failed: ${(e as Error).message} \nResponse: ${response || 'N/A'} `)
        )
      }
    })
  }

  async save(): Promise<Either<void, SwOSError>> {
    const change = this.store(this.vlans);
    const postResult = await this.client.post('/vlan.b', toMikrotik(change));
    if (postResult.isError()) return Either.error(postResult.getError());
    return (await this.load()).map(() => undefined);
  }

  private store(vlans: Vlan[]): VlanRequest[] {
    return vlans.map(v => ({
      vid: v.id,
      ivl: v.independentVlanLookup,
      igmp: v.igmpSnooping,
      prt: v.portMode,
    }));
  }

  addVlan(id: number): Either<Vlan, SwOSError> {
    if (this.vlans.find(v => v.id === id)) {
      return Either.error(new SwOSError('Vlan already exists'));
    }
    const newVlan: Vlan = {
      id,
      independentVlanLookup: false,
      igmpSnooping: false,
      portMode: new Array(this.numPorts).fill(VlanPortMode.LeaveAsIs),
    };
    this.vlans.push(newVlan);
    return Either.result(newVlan);
  }

  deleteVlan(id: number): void {
    this.vlans = this.vlans.filter(v => v.id !== id);
  }

  getVlan(id: number): Vlan | undefined {
    return this.vlans.find(v => v.id === id);
  }
}
