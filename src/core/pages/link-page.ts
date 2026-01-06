import { SwOSClient } from '../swos-client';
import { RawLinkStatus, Link, PoeMode, PoeStatus } from '../../types/link';
import { fixJson, hexToBoolArray, hexToString, parseHexInt, toMikrotik } from '../../utils/parsers';

export class LinkPage {
  private client: SwOSClient;
  public links: Link[] = [];

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<void> {
    const response = await this.client.fetch('/link.b');
    const fixed = fixJson(response);
    const raw: RawLinkStatus = JSON.parse(fixed);
    const numPorts = raw.nm.length;
    const en = hexToBoolArray(raw.en, numPorts);
    const an = hexToBoolArray(raw.an, numPorts);
    const lnk = hexToBoolArray(raw.lnk, numPorts);
    const dpx = hexToBoolArray(raw.dpx, numPorts);
    const dpxc = hexToBoolArray(raw.dpxc, numPorts);
    const fct = hexToBoolArray(raw.fct, numPorts);

    this.links = [];
    for (let i = 0; i < numPorts; i++) {
      const name = hexToString(raw.nm[i]);
      const poeMode = parseHexInt(raw.poe[i]) as PoeMode;
      const poePrio = parseHexInt(raw.prio[i]);
      const poeStatus = parseHexInt(raw.poes[i]) as PoeStatus;
      const speedControl = parseHexInt(raw.spdc[i]);
      const power = parseHexInt(raw.pwr[i]);
      const current = parseHexInt(raw.curr[i]);

      this.links.push({
        name,
        enabled: en[i],
        linkUp: lnk[i],
        duplex: dpx[i],
        duplexControl: dpxc[i],
        flowControl: fct[i],
        autoNegotiation: an[i],
        poeMode,
        poePrio,
        poeStatus,
        speedControl,
        power,
        current,
      });
    }
  }

  async save(): Promise<void> {
    const change = this.store();
    await this.client.post('/link.b', toMikrotik(change));
    await this.load(); // reload after save
  }

  private store(): any {
    const names = this.links.map(link => link.name);
    const en = this.links.map(link => link.enabled);
    const an = this.links.map(link => link.autoNegotiation);
    const spdc = this.links.map(link => link.speedControl);
    const dpxc = this.links.map(link => link.duplexControl);
    const fct = this.links.map(link => link.flowControl);
    const poe = this.links.map(link => link.poeMode);
    const prio = this.links.map(link => link.poePrio);

    return {
      nm: names,
      en: en.reduce((mask, enabled, i) => mask | (enabled ? 1 << i : 0), 0),
      an: an.reduce((mask, auto, i) => mask | (auto ? 1 << i : 0), 0),
      spdc,
      dpxc: dpxc.reduce((mask, control, i) => mask | (control ? 1 << i : 0), 0),
      fct: fct.reduce((mask, flow, i) => mask | (flow ? 1 << i : 0), 0),
      poe,
      prio,
    };
  }
}