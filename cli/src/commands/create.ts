import {Command, flags} from '@oclif/command'
import * as service from '../service/create'

export default class Create extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Create)

    const inbox = await service.create();

    console.log("Created inbox for identifier: " + inbox.owner);
  }
}
