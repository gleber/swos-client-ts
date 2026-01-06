import { describe, it, expect, beforeEach } from 'vitest';
import { SwOSClient } from '../core/swos-client.js';
import { server, http, HttpResponse } from './setup.js';

describe('LinkPage', () => {
  let client: SwOSClient;

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password');
  });

  it('should load link data from real device response', async () => {
    // Mock the response based on real device
    const rawResponse = '{en:"0x3f",lnk:"0x1e",dpx:"0x2e",dpxc:"0x3f",fct:"0x3f",an:"0x3f",poe:["0x0","0x0","0x0","0x0","0x0","0x0"],prio:["0x0","0x0","0x0","0x0","0x0","0x0"],poes:["0x0","0x0","0x0","0x0","0x0","0x0"],spdc:["0x0","0x0","0x0","0x0","0x0","0x0"],pwr:["0x0","0x0","0x0","0x0","0x0","0x0"],curr:["0x0","0x0","0x0","0x0","0x0","0x0"],nm:["506f7274310a","506f7274320a","506f7274330a","506f7274340a","506f7274350a","5366700a"],spd:["0x0","0x0","0x0","0x0","0x0","0x0"]}';

    server.use(
      http.get('http://192.168.1.4/link.b', () => {
        return HttpResponse.text(rawResponse);
      })
    );

    await client.links.load();

    expect(client.links.links).toHaveLength(6);
    expect(client.links.links[0]).toMatchObject({
      name: 'Port1\n',
      enabled: true,
      linkUp: false,
      duplex: false,
      duplexControl: true,
      flowControl: true,
      autoNegotiation: true,
      poeMode: 0,
      poePrio: 0,
      poeStatus: 0,
      speedControl: 0,
      power: 0,
      current: 0,
    });
    expect(client.links.links[1]).toMatchObject({
      name: 'Port2\n',
      linkUp: true,
      duplex: true,
    });
    expect(client.links.links[5]).toMatchObject({
      name: 'Sfp\n',
      duplex: true,
    });
  });
});