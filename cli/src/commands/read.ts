import { Command, flags } from "@oclif/command";
import * as service from "../service/read";

export default class Read extends Command {
  static description = "Read a channel";

  static flags = {
    help: flags.help({ char: "h" }),
    id_file: flags.string({
      char: "f",
      description: "Use this ID file",
    })
  };

  static args = [{ name: "channel", required: true }];
  static aliases = ["get"];

  async run(): Promise<void> {
    const { args, flags } = this.parse(Read);

    const messages = await service.read(args.channel, flags.id_file);

    messages
      .map((m) => `From: ${m.sender}: ${m.content}`)
      .forEach((line) => console.log(line));
  }
}
