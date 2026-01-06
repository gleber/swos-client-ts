import { describe, it, expect, beforeEach } from 'vitest';
import { SwOSClient } from '../core/swos-client.js';
import { server, http, HttpResponse } from './setup.js';

describe('SfpPage', () => {
  let client: SwOSClient;

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password');
  });

  it('should load sfp data from real device response', async () => {
    const rawResponse = '{vnd:,pnr:,ser:,tmp:ffffff80,tpw:0,rpw:0,vcc:0}';

    server.use(
      http.get('http://192.168.1.4/sfp.b', () => {
        return HttpResponse.text(rawResponse);
      })
    );

    await client.sfp.load();

    expect(client.sfp.sfp).toMatchObject({
      vendor: '',
      partNumber: '',
      serialNumber: '',
      temperature: 4294967168,
      txPower: 0,
      rxPower: 0,
      voltage: 0,
    });
  });
});