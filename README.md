# SwOS CLI

Note: This is a reimplementation of https://github.com/finomen/swos-client using AI. Code has been verified against SwOS 2.13 running on CSS106-5G-1S and CSS326-24G-2S+, but has not been thoroughly reviewed.

A TypeScript CLI tool to interact with Mikrotik managed switches running SwOS. This tool allows reading switch configurations programmatically, outputting data in JSON format.

There is no official documentation for the SwOS API, so compatibility may vary across versions or hardware.

## Installation

```bash
npm install -g .
```

Or build from source:

```bash
npm install
npm run build
```

## Running Without Installation

After building:

```bash
node dist/index.js status <switch-ip> -u <username> -p <password>
```

For development (without building):

```bash
npm run dev -- status <switch-ip> -u <username> -p <password>
```

## Usage

### Configuration

Create a `.env` file in the project root with your credentials:

```env
SWOS_USER=admin
SWOS_PASS=yourpassword
# Or specific host credentials (replace dots with underscores):
SWOS_USER_192_168_1_10=otheruser
SWOS_PASS_192_168_1_10=otherpass
```

Alternatively, set environment variables directly. The tool looks for:
1. Command line arguments
2. Host-specific variables (`SWOS_USER_<IP>`, `SWOS_PASS_<IP>`)
3. Global variables (`SWOS_USER`, `SWOS_PASS`)
4. Defaults (User: 'admin')

### Status Command

Fetch and display the current status of all supported switch configurations:

```bash
swos-cli status <switch-ip>
```

Or override credentials:

```bash
swos-cli status <switch-ip> -u <username> -p <password>
```

Example output (JSON):

```json
{
  "links": [
    {
      "name": "Port1",
      "enabled": true,
      "linkUp": false,
      "duplex": false,
      "duplexControl": true,
      "flowControl": true,
      "autoNegotiation": true,
      "poeMode": 0,
      "poePrio": 0,
      "poeStatus": 0,
      "speedControl": 0,
      "power": 0,
      "current": 0
    },
    {
      "name": "Port2",
      "enabled": true,
      "linkUp": true,
      "duplex": true,
      "duplexControl": true,
      "flowControl": true,
      "autoNegotiation": true,
      "poeMode": 0,
      "poePrio": 0,
      "poeStatus": 0,
      "speedControl": 0,
      "power": 0,
      "current": 0
    },
    {
      "name": "Port3",
      "enabled": true,
      "linkUp": true,
      "duplex": true,
      "duplexControl": true,
      "flowControl": true,
      "autoNegotiation": true,
      "poeMode": 0,
      "poePrio": 0,
      "poeStatus": 0,
      "speedControl": 0,
      "power": 0,
      "current": 0
    },
    {
      "name": "Port4",
      "enabled": true,
      "linkUp": true,
      "duplex": true,
      "duplexControl": true,
      "flowControl": true,
      "autoNegotiation": true,
      "poeMode": 0,
      "poePrio": 0,
      "poeStatus": 0,
      "speedControl": 0,
      "power": 0,
      "current": 0
    },
    {
      "name": "Port5",
      "enabled": true,
      "linkUp": true,
      "duplex": true,
      "duplexControl": true,
      "flowControl": true,
      "autoNegotiation": true,
      "poeMode": 0,
      "poePrio": 0,
      "poeStatus": 0,
      "speedControl": 0,
      "power": 0,
      "current": 0
    },
    {
      "name": "Sfp",
      "enabled": true,
      "linkUp": true,
      "duplex": true,
      "duplexControl": true,
      "flowControl": true,
      "autoNegotiation": true,
      "poeMode": 0,
      "poePrio": 0,
      "poeStatus": 0,
      "speedControl": 0,
      "power": 0,
      "current": 0
    }
  ],
  "sys": {
    "mac": "08:55:31:00:1b:19",
    "serialNumber": "D53D0DB61E5C",
    "identity": "office-router",
    "version": "2.13",
    "boardName": "CSS106-5G-1S",
    "rootBridgeMac": "08:55:31:00:1b:19",
    "uptime": 93751318,
    "ip": "192.168.1.4",
    "build": 1619425265,
    "dsc": 1,
    "wdt": 1,
    "mikrotikDiscoveryProtocol": [false, false, false, false, false, false],
    "independentVlanLookup": false,
    "allowFrom": "0.0.0.0",
    "allm": 0,
    "allowFromPorts": [true, true, true, true, true, true],
    "allowFromVlan": 0,
    "igmpSnooping": false,
    "igmpQuerier": true,
    "longPoeCable": false,
    "igmpFastLeave": [false, false, false, false, false, false],
    "igmpVersion": 2,
    "voltage": 0,
    "temperature": 0,
    "bridgePriority": 32768,
    "portCostMode": 0,
    "forwardReservedMulticast": true,
    "addressAcquisition": 0,
    "staticIpAddress": "192.168.1.216"
  },
  "vlan": [
    {
      "id": 1,
      "independentVlanLookup": false,
      "igmpSnooping": false,
      "portMode": [0, 0, 0, 0, 0, 0]
    }
  ],
  "fwd": {
    "enabled": [true, true, true, true, true, true],
    "linkUp": [false, true, true, true, true, true],
    "flowControl": [true, true, true, true, true, true],
    "mirror": 0,
    "defaultVlanId": [1, 1, 1, 1, 1, 1],
    "vlanId": [1, 1, 1, 1, 1, 1],
    "vlanMode": [0, 0, 0, 0, 0, 0],
    "locked": [false, false, false, false, false, false],
    "rateLimit": [0, 0, 0, 0, 0, 0],
    "broadcastLimit": [0, 0, 0, 0, 0, 0],
    "multicastLimit": [0, 0, 0, 0, 0, 0],
    "unicastLimit": [0, 0, 0, 0, 0, 0]
  },
  "rstp": {
    "enabled": true,
    "role": [1, 2, 2, 2, 2, 2],
    "status": [3, 3, 3, 3, 3, 3],
    "priority": [128, 128, 128, 128, 128, 128],
    "cost": [4, 4, 4, 4, 4, 4],
    "portId": [1, 2, 3, 4, 5, 6]
  },
  "sfp": {
    "vendor": "Mikrotik",
    "partNumber": "SFP-1G-SX",
    "serialNumber": "MT12345678",
    "temperature": 25,
    "txPower": -5,
    "rxPower": -10,
    "voltage": 3.3
  }
}
```

## How It Works

SwOS does not provide a standard REST API. Instead, this tool mimics browser behavior by sending HTTP GET/POST requests to internal endpoints (e.g., `/link.b`, `/sys.b`) using Digest Authentication.

### Key Mechanisms

- **Authentication**: HTTP Digest Auth (RFC 2617) for secure access.
- **Requests**: GET for reading data, POST for updates (read-only focus here).
- **Data Parsing**: SwOS returns custom JSON-like strings with unquoted keys and hex values. The tool fixes and parses these into typed TypeScript interfaces.
- **Session Handling**: Reuses HTTP client for multiple requests without explicit sessions.

### Supported Pages

| Page in UI  | Endpoint | Status      | Description                   |
| ----------- | -------- | ----------- | ----------------------------- |
| Link        | /link.b  | Implemented | Port status, speeds, PoE      |
| System      | /sys.b   | Implemented | System settings, IP, identity |
| SFP         | /sfp.b   | Implemented | SFP module info               |
| RSTP        | /rstp.b  | Implemented | STP settings                  |
| Forwarding  | /fwd.b   | Implemented | VLAN modes, locking, limits   |
| VLANs       | /vlan.b  | Implemented | VLAN definitions              |
| Hosts       | /host.b  | Missing     | Host table                    |
| IGMP Groups | /igmp.b  | Missing     | IGMP snooping                 |
| SNMP        | /snmp.b  | Missing     | SNMP config                   |
| ACL         | /acl.b   | Missing     | Access lists                  |
| Statistics  | /stats.b | Missing     | Traffic stats                 |
| Errors      | /stats.b | Missing     | Error counters                |

Status:
- *Missing*: Not implemented
- *Implemented*: Basic read functionality

## Development

Built with TypeScript, using Biome for linting/formatting and Vitest for testing.

### Scripts

- `npm run build`: Compile TypeScript
- `npm run dev`: Run in development mode
- `npm run test`: Run tests
- `npm run lint`: Lint code

## Contributing

Contributions welcome! Focus on adding missing pages or improving parsing.

## License

MIT