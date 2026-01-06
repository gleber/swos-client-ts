declare module 'digest-fetch' {
  class DigestFetch {
    constructor(username: string, password: string)
    fetch(url: string | Request, options?: RequestInit): Promise<Response>
  }
  export = DigestFetch
}
