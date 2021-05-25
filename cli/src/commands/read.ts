import {Command, flags} from '@oclif/command'
import * as service from "../service/read";

export default class Read extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'channel'}]
  static aliases = ['get']

  async run() {
    const {args, flags} = this.parse(Read)

    const messages = await service.read(args.channel);

    messages
      .map(m => `From: ${m.sender}: ${m.content}`)
      .forEach(line => console.log(line))
  }
}
