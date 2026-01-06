import { DigestFetch } from 'digest-fetch';
import { LinkPage } from './pages/link-page';
import { SfpPage } from './pages/sfp-page';
import { SysPage } from './pages/sys-page';
import { VlanPage } from './pages/vlan-page';
import { FwdPage } from './pages/fwd-page';
import { RstpPage } from './pages/rstp-page';

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

  async fetch(endpoint: string): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.client.fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }

  async post(endpoint: string, body: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.client.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async fetchAll(): Promise<void> {
    await this.links.load();
    const numPorts = this.links.links.length;
    this.sys.setNumPorts(numPorts);
    this.vlan.setNumPorts(numPorts);
    await this.sfp.load();
    await this.sys.load();
    await this.vlan.load();
    await this.fwd.load();
    await this.rstp.load();
  }
}