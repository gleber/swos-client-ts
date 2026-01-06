import DigestFetch from 'digest-fetch';
import { Either } from '../types/either.js';
import { SwOSError } from '../types/error.js';
import { LinkPage } from './pages/link-page.js';
import { SfpPage } from './pages/sfp-page.js';
import { SysPage } from './pages/sys-page.js';
import { VlanPage } from './pages/vlan-page.js';
import { FwdPage } from './pages/fwd-page.js';
import { RstpPage } from './pages/rstp-page.js';

export class SwOSClient {
  private client: DigestFetch;
  private baseUrl: string;

  public links: LinkPage;
  public sfp: SfpPage;
  public sys: SysPage;
  public vlan: VlanPage;
  public fwd: FwdPage;
  public rstp: RstpPage;

  constructor(host: string, username: string, password: string) {
    this.baseUrl = `http://${host}`;
    this.client = new DigestFetch(username, password);
    this.links = new LinkPage(this);
    this.sfp = new SfpPage(this);
    this.sys = new SysPage(this);
    this.vlan = new VlanPage(this);
    this.fwd = new FwdPage(this);
    this.rstp = new RstpPage(this);
  }

  async fetch(endpoint: string): Promise<Either<string, SwOSError>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await this.client.fetch(url);
      if (!response.ok) {
        return Either.error(new SwOSError(`HTTP ${response.status}: ${response.statusText}`));
      }
      const text = await response.text();
      return Either.result(text);
    } catch (e) {
      return Either.error(new SwOSError((e as Error).message));
    }
  }

  async post(endpoint: string, body: string): Promise<Either<void, SwOSError>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await this.client.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body,
      });
      if (!response.ok) {
        return Either.error(new SwOSError(`HTTP ${response.status}: ${response.statusText}`));
      }
      return Either.result(undefined);
    } catch (e) {
      return Either.error(new SwOSError((e as Error).message));
    }
  }

  async fetchAll(): Promise<Either<void, SwOSError>> {
    return (await this.links.load()).fold<Promise<Either<void, SwOSError>>>(
      async () => {
        const numPorts = this.links.links.length;
        this.sys.setNumPorts(numPorts);
        this.vlan.setNumPorts(numPorts);

        const sfpResult = await this.sfp.load();
        sfpResult.fold(() => { }, err => console.error(err.message));

        return (await this.sys.load()).fold<Promise<Either<void, SwOSError>>>(
          async () => {
            const vlanResult = await this.vlan.load();
            vlanResult.fold(() => { }, err => console.error(err.message));

            const fwdResult = await this.fwd.load();
            fwdResult.fold(() => { }, err => console.error(err.message));

            const rstpResult = await this.rstp.load();
            rstpResult.fold(() => { }, err => console.error(err.message));

            return Either.result(undefined);
          },
          err => Promise.resolve(Either.error(err))
        );
      },
      err => Promise.resolve(Either.error(err))
    );
  }
}