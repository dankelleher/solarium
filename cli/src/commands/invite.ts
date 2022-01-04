import { Command, flags } from "@oclif/command";
import * as service from "../service/invite";

export default class Invite extends Command {
  static description = "Invite someone to a group channel";
  static examples = ["solarium invite did:sol:<INVITEE> <CHANNEL_ADDRESS>"];

  static flags = {
    help: flags.help({ char: "h" }),
    id_file: flags.string({
      char: "f",
      description: "Use this ID file",
    })
  };

  static args = [
    { name: "invitee", description: "The invitee DID" },
    { name: "channel", description: "The channel address" },
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(Invite);

    await service.invite(args.invitee, args.channel, flags.id_file);

    console.log(`Added ${args.invitee} to channel ${args.channel}`);
  }
}
