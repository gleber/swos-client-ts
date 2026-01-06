import 'dotenv/config'
import { Command } from 'commander'
import { SwOSClient } from './core/swos-client.js'

const program = new Command()

program.name('swos-cli').description('CLI to manage Mikrotik SwOS devices').version('1.0.0')

program
  .command('status')
  .argument('<ip>', 'Switch IP address')
  .option('-u, --user <name>', 'Username')
  .option('-p, --pass <password>', 'Password')
  .action(async (ip, options) => {
    const sanitizedIp = ip.replace(/\./g, '_')
    const envUser = process.env[`SWOS_USER_${sanitizedIp}`] || process.env.SWOS_USER || 'admin'
    const envPass = process.env[`SWOS_PASS_${sanitizedIp}`] || process.env.SWOS_PASS

    const user = options.user || envUser
    const pass = options.pass || envPass

    const client = new SwOSClient(ip, user, pass)
    const result = await client.fetchAll()
    if (result.isError()) {
      console.error('Error:', result.getError().message)
      process.exit(1)
    }
    const data = result.getResult()
    console.log(JSON.stringify(data, null, 2))
  })

program.parse()
