import { Command, flags } from "@oclif/command";
import * as service from "../service/post";

export default class Post extends Command {
  static description = "Post to a channel";

  static flags = {
    help: flags.help({ char: "h" }),
    // -c, --channel=<ADDRESS>
    channel: flags.string({
      char: "c",
      description: "Channel address",
      required: true,
    }),
    // -i, --from-stdin
    "from-stdin": flags.boolean({ char: "i" }),
    id_file: flags.string({
      char: "f",
      description: "Use this ID file",
    })
  };

  static args = [{ name: "message" }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(Post);

    if (flags["from-stdin"]) {
      process.stdin.on("data", async (data: string) => {
        await service.post(data, flags.channel, flags.id_file);
      });
    } else {
      await service.post(args.message, flags.channel, flags.id_file);
    }
  }
}
