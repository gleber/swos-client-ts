import { describe, it, expect, beforeEach } from 'vitest';
import { SwOSClient } from '../core/swos-client.js';
import { server, http, HttpResponse } from './setup.js';

describe('FwdPage', () => {
  let client: SwOSClient;

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password');
  });

  it('should load fwd data from real device response', async () => {
    const rawResponse = '{ir:0,or:0,fp1:3f,fp2:3f,fp3:3f,fp4:3f,fp5:3f,fp6:3f,lck:0,imr:0,vlan:["1","1","1","1","1","1"],dvid:["1","1","1","1","1","1"],vlni:["0","0","0","0","0","0"],srt:["0","0","0","0","0","0"]}';

    server.use(
      http.get('http://192.168.1.4/fwd.b', () => {
        return HttpResponse.text(rawResponse);
      })
    );

    await client.fwd.load();

    expect(client.fwd.fwd).toMatchObject({
      enabled: [true, true, true, true, true, true],
      linkUp: [false, false, false, false, false, false],
      flowControl: [false, false, false, false, false, false],
      mirror: 0,
      defaultVlanId: [1, 1, 1, 1, 1, 1],
      vlanId: [1, 1, 1, 1, 1, 1],
      vlanMode: [0, 0, 0, 0, 0, 0],
      locked: [false, false, false, false, false, false],
      rateLimit: [0, 0, 0, 0, 0, 0],
      broadcastLimit: [0, 0, 0, 0, 0, 0],
      multicastLimit: [0, 0, 0, 0, 0, 0],
      unicastLimit: [0, 0, 0, 0, 0, 0],
    });
  });
});