# SwOS CLI

A TypeScript library and CLI tool to interact with Mikrotik managed switches running SwOS. The CLI allows reading switch configurations programmatically, outputting data in JSON format. The library has logic to save the configuration back to the switch.

This library is a comprehensive TypeScript implementation of the SwOS API. It has been verified against SwOS 2.13 and includes support for all major configuration pages

> [!IMPORTANT]
> There is no official documentation for the SwOS API, so compatibility may vary across versions or hardware. Code has been verified against SwOS 2.13 running on CSS106-5G-1S and CSS326-24G-2S+, but has not been thoroughly reviewed. While saving configuration is implemented, exercise caution when automating changes on production switches.

This started as a reimplementation of https://github.com/finomen/swos-client to TypeScript using AI. 

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
      "linkStatus": 0,
      "duplex": 0,
      "flowControl": 3,
      "autoNegotiation": true,
      "speedControl": "1G",
      "cableTest": {
         "length": 0,
         "faultAt": 0,
         "pairStatus": [0, 0, 0, 0]
      }
    }
    // ...
  ],
  "sys": {
    "identity": "office-router",
    "version": "2.13",
    "ip": "192.168.1.4",
    "boardTemperature": 45,
    "psu": [
      { "voltage": 24000, "current": 500, "status": 1 }
    ],
    "poeOutStatus": [0, 1, 0, 0, 0, 0]
    // ...
  },
  "rstp": {
    "enabled": true,
    "ports": [
      {
        "role": "designated",
        "status": "forwarding",
        "cost": 10,
        "priority": 128
      }
    ]
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

| Page in UI  | Endpoint  | Status           | Description                   |
| ----------- | --------- | ---------------- | ----------------------------- |
| Link        | /link.b   | Reads and writes | Port status, speeds, PoE      |
| System      | /sys.b    | Reads and writes | System settings, IP, identity |
| SFP         | /sfp.b    | Readonly         | SFP module info               |
| RSTP        | /rstp.b   | Reads and writes | STP settings                  |
| Forwarding  | /fwd.b    | Reads and writes | VLAN modes, locking, limits   |
| VLANs       | /vlan.b   | Reads and writes | VLAN definitions              |
| Hosts       | /host.b   | Readonly         | Host table                    |
| IGMP Groups | /igmp.b   | Readonly         | IGMP snooping groups          |
| SNMP        | /snmp.b   | Reads and writes | SNMP config                   |
| ACL         | /acl.b    | Reads            | Access lists                  |
| LAG         | /lacp.b   | Reads            | Link Aggregation (LACP)       |
| Statistics  | /!stats.b | Readonly         | Traffic stats & errors        |



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