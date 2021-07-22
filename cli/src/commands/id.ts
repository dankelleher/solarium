import { Command, flags } from "@oclif/command";
import * as service from "../service/id";
import { ExtendedId } from "../service/id";

const report = (extendedId: ExtendedId, verbose: boolean): void => {
  console.log("DID: " + extendedId.document.id);
  if (extendedId.userDetails) {
    console.log("Alias: " + extendedId.userDetails.alias);
  }

  verbose && console.log(JSON.stringify(extendedId.document, null, 1));
};

export default class Id extends Command {
  static description = "Show or create an identity";

  static flags = {
    help: flags.help({ char: "h" }),
    create: flags.boolean({
      char: "c",
      description: "Create a DID if missing",
      exclusive: ["update"],
    }),
    update: flags.boolean({
      char: "u",
      description: "Update a DID's user details",
      exclusive: ["create"],
    }),
    alias: flags.string({
      char: "a",
      description: "Set this ID's public alias",
    }),
    verbose: flags.boolean({
      char: "v",
      description: "Show the entire DID document",
    }),
  };

  async run(): Promise<void> {
    const { flags } = this.parse(Id);

    if (flags.create) {
      const extendedId = await service.createId(flags.alias);
      report(extendedId, flags.verbose);
    } else if (flags.update) {
      if (!flags.alias)
        throw new Error("Missing alias. Try: solarium id -u -a <NEW ALIAS>");
      await service.updateId(flags.alias);
      console.log("Updated");
    } else {
      const extendedId = await service.getId();
      if (!extendedId) {
        console.log("You have no DID - create one with: solarium id -c");
      } else {
        report(extendedId, flags.verbose);
      }
    }
  }
}
