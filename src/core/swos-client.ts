import DigestFetch from 'digest-fetch'
import { Either } from '../types/either.js'
import { SwOSError } from '../types/error.js'
import type { Fwd } from '../types/fwd.js'
import type { Link } from '../types/link.js'
import type { Rstp } from '../types/rstp.js'
import type { SfpStatus } from '../types/sfp.js'
import type { Sys } from '../types/sys.js'
import type { Vlan } from '../types/vlan.js'
import type { Page } from './page.interface.js'
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

/**
 * Main client for interacting with a SwOS device.
 * Manages authentication and provides access to individual pages.
 */
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

  /**
   * Aggregates data from all supported pages into a single state object.
   * - Loads 'System' and 'Links' first to determine port count.
   * - fetches other pages (SFP, VLAN, FWD, RSTP) in parallel.
   * - gracefully handles failures in optional pages by returning undefined.
   */
  async fetchAll(): Promise<Either<SwOSData, SwOSError>> {
    const loadOptional = async <T>(page: Page<T>): Promise<T | undefined> => {
      const result = await page.load()
      if (result.isError()) {
        console.error(result.getError().message)
        return undefined
      }
      return result.getResult()
    }

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

    const [sfp, vlan, fwd, rstp] = await Promise.all([
      loadOptional(this.sfp),
      loadOptional(this.vlan),
      loadOptional(this.fwd),
      loadOptional(this.rstp),
    ])

    return Either.result({
      links,
      sys,
      sfp,
      vlan,
      fwd,
      rstp,
    })
  }

  /**
   * Saves the provided data back to the device.
   * Iterates through all pages and delegates saving to them if data is present.
   * Fails fast if any page save returns an error.
   *
   * @param data - The full SwOSData object containing updates
   */
  async save(data: SwOSData): Promise<Either<void, SwOSError>> {
    const savePage = async <T>(page: Page<T>, pageData?: T): Promise<Either<void, SwOSError>> => {
      if (!pageData) return Either.result(undefined);
      return page.save(pageData);
    }

    const results = await Promise.all([
      savePage(this.links, data.links),
      savePage(this.sys, data.sys),
      savePage(this.vlan, data.vlan),
      savePage(this.fwd, data.fwd),
      savePage(this.rstp, data.rstp),
      // sfp is read only
    ]);

    for (const result of results) {
      if (result.isError()) return result;
    }

    return Either.result(undefined)
  }
}
