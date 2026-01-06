import { SwOSClient } from '../swos-client.js';
import { Either } from '../../types/either.js';
import { SwOSError } from '../../types/error.js';
import { RawLinkStatus, Link, PoeMode, PoeStatus, LinkConfig } from '../../types/link.js';
import { fixJson, hexToBoolArray, hexToString, parseHexInt, toMikrotik } from '../../utils/parsers.js';

export class LinkPage {
  private client: SwOSClient;

  constructor(client: SwOSClient) {
    this.client = client;
  }

  async load(): Promise<Either<Link[], SwOSError>> {
    return (await this.client.fetch('/link.b')).flatMap(response => {
      try {
        const fixed = fixJson(response);
        const raw: RawLinkStatus = JSON.parse(fixed);
        const numPorts = raw.nm.length;
        const en = hexToBoolArray(raw.en, numPorts);
        const an = hexToBoolArray(raw.an, numPorts);
        const lnk = hexToBoolArray(raw.lnk, numPorts);
        const dpx = hexToBoolArray(raw.dpx, numPorts);
        const dpxc = hexToBoolArray(raw.dpxc, numPorts);
        const fct = hexToBoolArray(raw.fct, numPorts);

        const links: Link[] = [];
        for (let i = 0; i < numPorts; i++) {
          const name = hexToString(raw.nm[i]);
          const poeMode = raw.poe ? parseHexInt(raw.poe[i]) as PoeMode : 0;
          const poePrio = raw.prio ? parseHexInt(raw.prio[i]) : 0;
          const poeStatus = raw.poes ? parseHexInt(raw.poes[i]) as PoeStatus : 0;
          const speedControl = raw.spdc ? parseHexInt(raw.spdc[i]) : 0;
          const power = raw.pwr ? parseHexInt(raw.pwr[i]) : 0;
          const current = raw.curr ? parseHexInt(raw.curr[i]) : 0;

          links.push({
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
        return Either.result(links);
      } catch (e) {
        return Either.error(new SwOSError(`Link load failed: ${(e as Error).message}\nResponse: ${response || 'N/A'}`));
      }
    });
  }

  async save(links: Link[]): Promise<Either<Link[], SwOSError>> {
    const change = this.store(links);
    const postResult = await this.client.post('/link.b', toMikrotik(change));
    return postResult.fold(
      () => this.load(),
      (e) => Promise.resolve(Either.error(e))
    );
  }

  private store(links: Link[]): LinkConfig {
    const names = links.map(link => link.name);
    const en = links.map(link => link.enabled);
    const an = links.map(link => link.autoNegotiation);
    const spdc = links.map(link => link.speedControl);
    const dpxc = links.map(link => link.duplexControl);
    const fct = links.map(link => link.flowControl);
    const poe = links.map(link => link.poeMode);
    const prio = links.map(link => link.poePrio);

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