import { Command, flags } from "@oclif/command";
import * as service from "../service/addKey";

export default class AddKey extends Command {
  static description = "Add a new key to an existing DID";

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({
      required: true,
      char: "n",
      description: "the key name (e.g. mobileDevice)",
    }),
  };

  static args = [
    { name: "publicKey", description: "A public key in base-58 encoding" },
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(AddKey);

    await service.addKey(flags.name, args.publicKey);

    console.log("Added key");
  }
}
