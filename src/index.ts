import 'dotenv/config';
import { Command } from 'commander';
import { SwOSClient } from './core/swos-client.js';

const program = new Command();

program
  .name('swos-cli')
  .description('CLI to manage Mikrotik SwOS devices')
  .version('1.0.0');

program
  .command('status')
  .argument('<ip>', 'Switch IP address')
  .option('-u, --user <name>', 'Username', process.env.SWOS_USER || 'admin')
  .option('-p, --pass <password>', 'Password', process.env.SWOS_PASS)
  .action(async (ip, options) => {
    const client = new SwOSClient(ip, options.user, options.pass);
    const result = await client.fetchAll();
    if (result.isError()) {
      console.error('Error:', result.getError().message);
      process.exit(1);
    }
    const data = {
      links: client.links.links,
      sfp: client.sfp.sfp,
      sys: client.sys.sys,
      vlan: client.vlan.vlans,
      fwd: client.fwd.fwd,
      rstp: client.rstp.rstp,
    };
    console.log(JSON.stringify(data, null, 2));
  });

program.parse();