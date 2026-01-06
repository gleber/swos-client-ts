import { describe, it, expect, beforeEach } from 'vitest';
import { SwOSClient } from '../core/swos-client.js';
import { server, http, HttpResponse } from './setup.js';

describe('RstpPage', () => {
  let client: SwOSClient;

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password');
  });

  it('should load rstp data from real device response', async () => {
    const rawResponse = '{ena:1,role:["3","3","3","3","3","3"],lrn:e,cst:["0","4","4","4","0","0"]}';

    server.use(
      http.get('http://192.168.1.4/rstp.b', () => {
        return HttpResponse.text(rawResponse);
      })
    );

    const result = await client.rstp.load();
    expect(result.isResult()).toBe(true);

    expect(client.rstp.rstp).toMatchObject({
      enabled: true,
      role: [3, 3, 3, 3, 3, 3],
      status: [0, 1, 1, 1, 0, 0],
      priority: [0, 0, 0, 0, 0, 0],
      cost: [0, 4, 4, 4, 0, 0],
      portId: [0, 0, 0, 0, 0, 0],
    });
  });
});