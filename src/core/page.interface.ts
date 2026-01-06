
import { Either } from '../types/either.js'
import { SwOSError } from '../types/error.js'

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
    load(): Promise<Either<T, SwOSError>>

    /**
     * Serializes the data and posts it back to the device.
     * Often requires reloading data afterwards to confirm changes or get updated state.
     *
     * @param data - The data object to save
     */
    save(data: T): Promise<Either<void, SwOSError>>
}
