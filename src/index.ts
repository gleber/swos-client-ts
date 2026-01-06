import { Command } from 'commander';
import { SwOSClient } from './core/swos-client';

const program = new Command();

program
  .name('swos-cli')
  .description('CLI to manage Mikrotik SwOS devices')
  .version('1.0.0');

program
  .command('status')
  .argument('<ip>', 'Switch IP address')
  .option('-u, --user <name>', 'Username', 'admin')
  .option('-p, --pass <password>', 'Password')
  .action(async (ip, options) => {
    const client = new SwOSClient(ip, options.user, options.pass);
    try {
      await client.fetchAll();
      const data = {
        links: client.links.links,
        sfp: client.sfp.sfp,
        sys: client.sys.sys,
        vlan: client.vlan.vlans,
        fwd: client.fwd.fwd,
        rstp: client.rstp.rstp,
      };
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();