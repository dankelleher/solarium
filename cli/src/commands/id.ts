import {Command, flags} from '@oclif/command'
import * as service from '../service/id'

export default class Id extends Command {
  static description = 'Show or create an identity'

  static flags = {
    help: flags.help({char: 'h'}),
    create: flags.boolean({char: 'c', description: 'Create a DID if missing'}),
    verbose: flags.boolean({char: 'v', description: 'Show the entire DID document'}),
  }

  async run() {
    const {flags} = this.parse(Id)

    const get = await service.getId().catch(() => null);
    const document = flags.create ? await service.createId() : get;

    if (!document) {
      console.log("You have no DID - create one with: solarium id -c");
    } else {
      console.log("Your DID is: " + document.id);

      flags.verbose && console.log(JSON.stringify(document, null, 1));
    }
  }
}
