import {Command, flags} from '@oclif/command'
import * as service from "../service/read";

export default class Read extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]
  static aliases = ['get', ''] // Default command

  async run() {
    const {args, flags} = this.parse(Read)

    const messages = await service.read();

    messages
      .map(m => `From: ${m.sender}: ${m.content}`)
      .forEach(line => console.log(line))
  }
}
