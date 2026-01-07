import DigestFetch from 'digest-fetch'
import { Effect } from 'effect'
import type { AclRule } from '../types/acl.js'
import { SwOSError } from '../types/error.js'
import type { Fwd } from '../types/fwd.js'
import type { RawHostStatus } from '../types/host.js'
import type { RawIgmpStatus } from '../types/igmp.js'
import type { LagPort } from '../types/lag.js'
import type { Link } from '../types/link.js'
import type { Rstp } from '../types/rstp.js'
import type { SfpStatus } from '../types/sfp.js'
import type { RawSnmpStatus, Snmp } from '../types/snmp.js'
import type { PortStats } from '../types/stat.js'
import type { Sys } from '../types/sys.js'
import type { Vlan } from '../types/vlan.js'
import type { Page } from './page.interface.js'
import { AclPage } from './pages/acl-page.js'
import { FwdPage } from './pages/fwd-page.js'
import { HostPage } from './pages/host-page.js'
import { IgmpPage } from './pages/igmp-page.js'
import { LagPage } from './pages/lag-page.js'
import { LinkPage } from './pages/link-page.js'
import { RstpPage } from './pages/rstp-page.js'
import { SfpPage } from './pages/sfp-page.js'
import { SnmpPage } from './pages/snmp-page.js'
import { StatsPage } from './pages/stats-page.js'
import { SysPage } from './pages/sys-page.js'
import { VlanPage } from './pages/vlan-page.js'

export interface SwOSData {
  links: Link[]
  sys: Sys
  sfp?: SfpStatus[]
  vlan?: Vlan[]
  fwd?: Fwd
  rstp?: Rstp
  stats?: PortStats[]
  acl?: AclRule[]
  hosts?: RawHostStatus // Pending refactor if desired, but user only asked for stats/lag specifically
  igmp?: RawIgmpStatus
  lag?: LagPort[]
  snmp?: Snmp
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
  public stats: StatsPage
  public acl: AclPage
  public hosts: HostPage
  public igmp: IgmpPage
  public lag: LagPage
  public snmp: SnmpPage

  constructor(host: string, username: string, password: string) {
    this.baseUrl = `http://${host}`
    this.client = new DigestFetch(username, password)
    this.links = new LinkPage(this)
    this.sfp = new SfpPage(this)
    this.sys = new SysPage(this)
    this.vlan = new VlanPage(this)
    this.fwd = new FwdPage(this)
    this.rstp = new RstpPage(this)
    this.stats = new StatsPage(this)
    this.acl = new AclPage(this)
    this.hosts = new HostPage(this)
    this.igmp = new IgmpPage(this)
    this.lag = new LagPage(this)
    this.snmp = new SnmpPage(this)
  }

  fetch(endpoint: string): Effect.Effect<string, SwOSError> {
    return Effect.tryPromise({
      try: async () => {
        const url = `${this.baseUrl}${endpoint}`
        const response = await this.client.fetch(url)
        if (!response.ok) {
          throw new SwOSError(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.text()
      },
      catch: (e) => new SwOSError((e as Error).message),
    })
  }

  post(endpoint: string, body: string): Effect.Effect<void, SwOSError> {
    return Effect.tryPromise({
      try: async () => {
        const url = `${this.baseUrl}${endpoint}`
        const response = await this.client.fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body,
        })
        if (!response.ok) {
          throw new SwOSError(`HTTP ${response.status}: ${response.statusText}`)
        }
      },
      catch: (e) => new SwOSError((e as Error).message),
    })
  }

  /**
   * Aggregates data from all supported pages into a single state object.
   * - Loads 'System' and 'Links' first to determine port count.
   * - fetches other pages (SFP, VLAN, FWD, RSTP) in parallel.
   * - gracefully handles failures in optional pages by returning undefined.
   */
  fetchAll(): Effect.Effect<SwOSData, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const loadOptional = <T>(page: Page<T>) =>
        Effect.match(page.load(), {
          onFailure: (e) => {
            console.error(e.message) // Log but don't fail for optional pages?
            return undefined
          },
          onSuccess: (data) => data,
        })

      // Load Links first to get port count
      const links = yield* _(self.links.load())
      const numPorts = links.length

      self.sys.setNumPorts(numPorts)
      self.vlan.setNumPorts(numPorts)

      // Load Sys
      const sys = yield* _(self.sys.load())

      // Load optional pages concurrently
      const [sfp, vlan, fwd, rstp, stats, acl, hosts, igmp, lag, snmp] = yield* _(
        Effect.all([
          loadOptional(self.sfp),
          loadOptional(self.vlan),
          loadOptional(self.fwd),
          loadOptional(self.rstp),
          loadOptional(self.stats),
          loadOptional(self.acl),
          loadOptional(self.hosts),
          loadOptional(self.igmp),
          loadOptional(self.lag),
          loadOptional(self.snmp),
        ])
      )

      return {
        links,
        sys,
        sfp,
        vlan,
        fwd,
        rstp,
        stats,
        acl,
        hosts,
        igmp,
        lag,
        snmp,
      }
    })
  }

  /**
   * Saves the provided data back to the device.
   * Iterates through all pages and delegates saving to them if data is present.
   * Fails fast if any page save returns an error.
   *
   * @param data - The full SwOSData object containing updates
   */
  save(data: SwOSData): Effect.Effect<void, SwOSError> {
    const self = this
    return Effect.gen(function* (_) {
      const savePage = <T>(page: Page<T>, pageData?: T) => {
        if (!pageData) return Effect.void
        return page.save(pageData)
      }

      yield* _(
        Effect.all([
          savePage(self.links, data.links),
          savePage(self.sys, data.sys),
          savePage(self.vlan, data.vlan),
          savePage(self.fwd, data.fwd),
          savePage(self.rstp, data.rstp),
          // sfp is read only
        ])
      )
    })
  }

  async fetchAsync(endpoint: string): Promise<string> {
    return Effect.runPromise(this.fetch(endpoint))
  }

  async postAsync(endpoint: string, body: string): Promise<void> {
    return Effect.runPromise(this.post(endpoint, body))
  }

  async fetchAllAsync(): Promise<SwOSData> {
    return Effect.runPromise(this.fetchAll())
  }

  async saveAsync(data: SwOSData): Promise<void> {
    return Effect.runPromise(this.save(data))
  }
}
