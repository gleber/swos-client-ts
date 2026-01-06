import { describe, it, expect, beforeEach } from 'vitest';
import { SwOSClient } from '../core/swos-client.js';
import { server, http, HttpResponse } from './setup.js';

describe('VlanPage', () => {
  let client: SwOSClient;

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password');
  });

  it('should load vlan data from real device response', async () => {
    const rawResponse = '[]';

    server.use(
      http.get('http://192.168.1.4/vlan.b', () => {
        return HttpResponse.text(rawResponse);
      })
    );

    const result = await client.vlan.load();
    expect(result.isResult()).toBe(true);

    expect(client.vlan.vlans).toEqual([]);
  });
});