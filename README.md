# SwOS CLI

Note: This is a quick and dirty reimplementation of https://github.com/finomen/swos-client using AI. Code has not been thoroughly reviewed.

A TypeScript CLI tool to interact with Mikrotik managed switches running SwOS. This tool allows reading switch configurations programmatically, outputting data in JSON format.

There is no official documentation for the SwOS API, so compatibility may vary across versions or hardware. Tested with CSS106-1G-4P-1S running SwOS 2.18.

## Installation

```bash
npm install -g .
```

Or build from source:

```bash
npm install
npm run build
```

## Usage

### Status Command

Fetch and display the current status of all supported switch configurations:

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
      "linkUp": true,
      "duplex": true,
      "poeMode": 1,
      ...
    }
  ],
  "sys": {
    "identity": "Mikrotik",
    "version": "2.18",
    "ip": "192.168.88.1",
    ...
  },
  "vlan": [...],
  "fwd": {...},
  "rstp": {...},
  "sfp": {...}
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

| Page in UI  | Endpoint    | Status      | Description |
|-------------|-------------|-------------|-------------|
| Link        | /link.b     | Implemented | Port status, speeds, PoE |
| System      | /sys.b      | Implemented | System settings, IP, identity |
| SFP         | /sfp.b      | Implemented | SFP module info |
| RSTP        | /rstp.b     | Implemented | STP settings |
| Forwarding  | /fwd.b      | Implemented | VLAN modes, locking, limits |
| VLANs       | /vlan.b     | Implemented | VLAN definitions |
| Hosts       | /host.b     | Missing     | Host table |
| IGMP Groups | /igmp.b     | Missing     | IGMP snooping |
| SNMP        | /snmp.b     | Missing     | SNMP config |
| ACL         | /acl.b      | Missing     | Access lists |
| Statistics  | /stats.b    | Missing     | Traffic stats |
| Errors      | /stats.b    | Missing     | Error counters |

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