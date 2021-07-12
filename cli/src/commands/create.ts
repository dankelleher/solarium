import { Command, flags } from "@oclif/command";
import * as service from "../service/create";

export default class Create extends Command {
  static description = "Create a channel";

  static flags = {
    help: flags.help({ char: "h" }),
  };

  static args = [{ name: "name", required: true }];

  async run(): Promise<void> {
    const { args } = this.parse(Create);

    const channel = await service.create(args.name);

    console.log(`Created channel ${args.name}: ${channel.address.toBase58()}`);
  }
}
