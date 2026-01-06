import DigestFetch from 'digest-fetch'
import { Either } from '../types/either.js'
import { SwOSError } from '../types/error.js'
import type { Fwd } from '../types/fwd.js'
import type { Link } from '../types/link.js'
import type { Rstp } from '../types/rstp.js'
import type { SfpStatus } from '../types/sfp.js'
import type { Sys } from '../types/sys.js'
import type { Vlan } from '../types/vlan.js'
import { FwdPage } from './pages/fwd-page.js'
import { LinkPage } from './pages/link-page.js'
import { RstpPage } from './pages/rstp-page.js'
import { SfpPage } from './pages/sfp-page.js'
import { SysPage } from './pages/sys-page.js'
import { VlanPage } from './pages/vlan-page.js'

export interface SwOSData {
  links: Link[]
  sys: Sys
  sfp?: SfpStatus[]
  vlan?: Vlan[]
  fwd?: Fwd
  rstp?: Rstp
}

export class SwOSClient {
  private client: DigestFetch
  private baseUrl: string

  public links: LinkPage
  public sfp: SfpPage
  public sys: SysPage
  public vlan: VlanPage
  public fwd: FwdPage
  public rstp: RstpPage

  constructor(host: string, username: string, password: string) {
    this.baseUrl = `http://${host}`
    this.client = new DigestFetch(username, password)
    this.links = new LinkPage(this)
    this.sfp = new SfpPage(this)
    this.sys = new SysPage(this)
    this.vlan = new VlanPage(this)
    this.fwd = new FwdPage(this)
    this.rstp = new RstpPage(this)
  }

  async fetch(endpoint: string): Promise<Either<string, SwOSError>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await this.client.fetch(url)
      if (!response.ok) {
        return Either.error(new SwOSError(`HTTP ${response.status}: ${response.statusText}`))
      }
      const text = await response.text()
      return Either.result(text)
    } catch (e) {
      return Either.error(new SwOSError((e as Error).message))
    }
  }

  async post(endpoint: string, body: string): Promise<Either<void, SwOSError>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await this.client.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body,
      })
      if (!response.ok) {
        return Either.error(new SwOSError(`HTTP ${response.status}: ${response.statusText}`))
      }
      return Either.result(undefined)
    } catch (e) {
      return Either.error(new SwOSError((e as Error).message))
    }
  }

  async fetchAll(): Promise<Either<SwOSData, SwOSError>> {
    const linksResult = await this.links.load()
    if (linksResult.isError()) {
      return Either.error(linksResult.getError())
    }
    const links = linksResult.getResult()

    const numPorts = links.length
    this.sys.setNumPorts(numPorts)
    this.vlan.setNumPorts(numPorts)

    const sysResult = await this.sys.load()
    if (sysResult.isError()) {
      return Either.error(sysResult.getError())
    }
    const sys = sysResult.getResult()

    const sfpResult = await this.sfp.load()
    const sfp = sfpResult.isResult() ? sfpResult.getResult() : undefined
    if (sfpResult.isError()) console.error(sfpResult.getError().message)

    const vlanResult = await this.vlan.load()
    const vlan = vlanResult.isResult() ? vlanResult.getResult() : undefined
    if (vlanResult.isError()) console.error(vlanResult.getError().message)

    const fwdResult = await this.fwd.load()
    const fwd = fwdResult.isResult() ? fwdResult.getResult() : undefined
    if (fwdResult.isError()) console.error(fwdResult.getError().message)

    const rstpResult = await this.rstp.load()
    const rstp = rstpResult.isResult() ? rstpResult.getResult() : undefined
    if (rstpResult.isError()) console.error(rstpResult.getError().message)

    return Either.result({
      links,
      sys,
      sfp,
      vlan,
      fwd,
      rstp,
    })
  }
}
