import { Effect } from 'effect'
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

    try {
      const data = await Effect.runPromise(client.fetchAll())
      console.log(JSON.stringify(data, null, 2))
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('Error:', e.message)
      } else {
        console.error('Unknown Error:', e)
      }
      process.exit(1)
    }
  })

program.parse()
