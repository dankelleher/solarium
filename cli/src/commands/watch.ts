import { Command, flags } from "@oclif/command";
import * as service from "../service/read";
import { Message } from "solarium-js";

export default class Watch extends Command {
  static description = "Listen to new messages from a channel";

  static flags = {
    help: flags.help({ char: "h" }),
    id_file: flags.string({
      char: "f",
      description: "Use this ID file",
    })
  };

  static args = [{ name: "channel" }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(Watch);

    const messages = await service.readStream(args.channel, flags.id_file);

    messages.subscribe((message: Message) => {
      console.log(`From: ${message.sender}: ${message.content}`);
    });
  }
}
