import { Effect } from 'effect'
import { describe, expect, it, vi } from 'vitest'
import { SwOSClient } from '../core/swos-client'

describe('SwOSClient', () => {
    it('should fetch and parse dhosts with mixed integer/hex ports', async () => {
        const client = new SwOSClient('192.168.1.1', 'admin', '')

        // Mock the fetch method of SwOSClient 
        // We cast to any to spy on private/protected members if needed, 
        // but fetch is public in SwOSClient (Wait, is it?)
        // Checking SwOSClient definition: getDHosts calls self.fetch.
        // fetch is public in SwOSClient definition (Step 43).

        const mockResponse = JSON.stringify([
            { prt: 1, adr: '001122334455', vid: 10 },
            { prt: '0x02', adr: 'AABBCCDDEEFF', vid: 20 },
        ])

        const fetchSpy = vi.spyOn(client, 'fetch').mockImplementation((endpoint) => {
            if (endpoint === '/!dhost.b') {
                return Effect.succeed(mockResponse)
            }
            return Effect.fail(new Error(`Unexpected endpoint: ${endpoint}`)) as any
        })

        const result = await Effect.runPromise(client.getDHosts())

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ port: 1, mac: '00:11:22:33:44:55', vlanId: 10 })
        expect(result[1]).toEqual({ port: 2, mac: 'AA:BB:CC:DD:EE:FF', vlanId: 20 })
    })
})
