import { Command, flags } from "@oclif/command";
import * as service from "../service/id";

export default class Id extends Command {
  static description = "Show or create an identity";

  static flags = {
    help: flags.help({ char: "h" }),
    create: flags.boolean({
      char: "c",
      description: "Create a DID if missing",
    }),
    alias: flags.string({
      char: "a",
      description: "Set this ID's public alias",
      dependsOn: ["create"],
    }),
    verbose: flags.boolean({
      char: "v",
      description: "Show the entire DID document",
    }),
  };

  async run(): Promise<void> {
    const { flags } = this.parse(Id);

    const get = await service.getId();
    const extendedId = flags.create ? await service.createId(flags.alias) : get;

    if (!extendedId) {
      console.log("You have no DID - create one with: solarium id -c");
    } else {
      console.log("DID: " + extendedId.document.id);
      if (extendedId.userDetails) {
        console.log("Alias: " + extendedId.userDetails.alias);
      }

      flags.verbose && console.log(JSON.stringify(document, null, 1));
    }
  }
}
