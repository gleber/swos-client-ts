declare module 'digest-fetch' {
  export class DigestFetch {
    constructor(username: string, password: string);
    fetch(url: string | Request, options?: RequestInit): Promise<Response>;
  }
}