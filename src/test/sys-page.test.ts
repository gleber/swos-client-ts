import { describe, it, expect, beforeEach } from 'vitest';
import { SwOSClient } from '../core/swos-client.js';
import { server, http, HttpResponse } from './setup.js';

describe('SysPage', () => {
  let client: SwOSClient;

  beforeEach(() => {
    client = new SwOSClient('192.168.1.4', 'admin', 'password');
  });

  it('should load sys data from real device response', async () => {
    const rawResponse = '{mac:085531001b19,sn:D53D0DB61E5C,id:6f66666963652d726f75746572,ver:322e3133,brd:4353533130362d35472d3153,rbmac:085531001b19,up:59b8b46,ip:c0a80104,bld:6076c0e1,dsc:1,wdt:1,mdp:0,ivl:0,af:0,allm:0,afp:3f,afv:0,igs:0,igq:1,lpc:0,igfl:0,igv:0,volt:0,temp:0,bpri:8000,pcm:0,frm:1,aa:0,sip:d8a80104}';

    server.use(
      http.get('http://192.168.1.4/sys.b', () => {
        return HttpResponse.text(rawResponse);
      })
    );

    await client.sys.load();

    expect(client.sys.sys).toMatchObject({
      mac: '08:55:31:00:1b:19',
      serialNumber: 'D53D0DB61E5C',
      identity: 'office-router',
      version: '2.13',
      boardName: 'CSS106-5G-1S',
      rootBridgeMac: '08:55:31:00:1b:19',
      uptime: 93751318,
      ip: '192.168.1.4',
      build: 1619425265,
      dsc: 1,
      wdt: 1,
      mikrotikDiscoveryProtocol: [false, false, false, false, false, false],
      independentVlanLookup: false,
      allowFrom: '0.0.0.0',
      allm: 0,
      allowFromPorts: [true, true, true, true, true, true],
      allowFromVlan: 0,
      igmpSnooping: false,
      igmpQuerier: true,
      longPoeCable: false,
      igmpFastLeave: [false, false, false, false, false, false],
      igmpVersion: null,
      voltage: 0,
      temperature: 0,
      bridgePriority: 32768,
      portCostMode: 0,
      forwardReservedMulticast: true,
      addressAcquisition: 0,
      staticIpAddress: '192.168.1.216',
    });
  });
});