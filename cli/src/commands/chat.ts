import { Command, flags } from "@oclif/command";
import { streamToStringRx } from "rxjs-stream";
import * as service from "../service/chat";

export default class Chat extends Command {
  static description =
    "Chat with another DID. Note: the DID must already exist.";

  static flags = {
    help: flags.help({ char: "h" }),
    mute: flags.boolean({ char: "m", description: "non-verbose input" }),
    id_file: flags.string({
      char: "f",
      description: "Use this ID file",
    })
  };

  static args = [
    { name: "with", description: "The DID to chat with", required: true },
  ];
  static aliases = [""]; // Default command

  async run(): Promise<void> {
    const { args, flags } = this.parse(Chat);

    const incomingMessages = streamToStringRx(process.stdin);

    const messages = await service.chat(args.with, incomingMessages, flags.id_file);

    messages.subscribe((message) => {
      if (flags.mute) {
        if (message.sender === args.with) {
          // do not echo own messages
          console.log(message.content);
        }
      } else {
        console.log(`From: ${message.sender}: ${message.content}`);
      }
    });
  }
}
