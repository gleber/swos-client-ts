export class SwOSError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'SwOSError';
  }
}