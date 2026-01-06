import type { Effect } from 'effect'
import type { SwOSError } from '../types/error.js'

/**
 * Represents a stateless page interaction with SwOS.
 * Each implementation handles loading specific data from an endpoint
 * and saving it back to the device.
 *
 * These are named pages since it correspond to pages in SwOS web interface.
 */
export interface Page<T> {
  /**
   * Fetches data from the device and parses it into a typed object.
   * This method should be stateless and idempotent.
   */
  load(): Effect.Effect<T, SwOSError>

  /**
   * Async wrapper for load() that returns a Promise.
   * Uses Effect.runPromise internally.
   */
  loadAsync(): Promise<T>

  /**
   * Serializes the data and posts it back to the device.
   * Often requires reloading data afterwards to confirm changes or get updated state.
   *
   * @param data - The data object to save
   */
  save(data: T): Effect.Effect<void, SwOSError>

  /**
   * Async wrapper for save() that returns a Promise.
   * Uses Effect.runPromise internally.
   *
   * @param data - The data object to save
   */
  saveAsync(data: T): Promise<void>
}
