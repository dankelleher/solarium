import {Command, flags} from '@oclif/command'
import * as service from '../service/post'

export default class Post extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // -r, --recipient=DID
    recipient: flags.string({char: 'r', description: 'Recipient DID', required: true}),
    // -i, --from-stdin
    'from-stdin': flags.boolean({char: 'i'}),
  }

  static args = [{name: 'message'}]

  async run() {
    const {args, flags} = this.parse(Post)

    if (flags["from-stdin"]) {
      process.stdin.on('data', async (data:string) => {
        await service.post(data, flags.recipient);
      });
    } else {
      await service.post(args.message, flags.recipient);
    }
  }
}
