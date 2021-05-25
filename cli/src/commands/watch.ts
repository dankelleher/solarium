import {Command, flags} from '@oclif/command'
import * as service from "../service/read";
import {Message} from "solarium-js";

export default class Watch extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'channel'}]

  async run() {
    const {args, flags} = this.parse(Watch)

    const messages = await service.readStream(args.channel);

    messages.subscribe((message: Message) => {
      console.log(`From: ${message.sender}: ${message.content}`)
    });
  }
}
