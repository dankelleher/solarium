import {Command, flags} from '@oclif/command'
import {rxToStream, streamToStringRx} from 'rxjs-stream';
import * as service from "../service/chat";

export default class Chat extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'with', required: true}]
  static aliases = [''] // Default command

  async run() {
    const {args, flags} = this.parse(Chat)

    const incomingMessages = streamToStringRx(process.stdin)

    const messages = await service.chat(args.with, incomingMessages)

    messages
      .subscribe(message => {
        console.log(`From: ${message.sender}: ${message.content}`)
      });
  }
}
