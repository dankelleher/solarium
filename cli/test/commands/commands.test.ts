import { expect, test } from "@oclif/test";

import Create from "../../src/commands/create";
import Invite from "../../src/commands/invite";
import Id from "../../src/commands/id";
import Post from "../../src/commands/post";
import Read from "../../src/commands/read";

import sinon from "sinon";

describe("command line", () => {
  let channelAddress: string;

  before(async function () {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const execSync = require("child_process").execSync;
    // alice
    execSync("solana airdrop 1 BrSACyPFCpXMug2LjWVGSxnHeiFSpZCrFQvFYyMn1f3Q");
    //bob
    execSync("solana airdrop 1 Fj6QJEa5xK95sxnXMNo4w8fzbVfdB6vdxEUp2JjCcPt9");

    // TODO: we can read the DIDs from here instead of hard coding below
    await Id.run(["-c", "-f", "../../test/alice.json"]);
    await Id.run(["-c", "-f", "../../test/bob.json"]);

    const spy: sinon.SinonSpy = sinon.spy(console, "log");
    await Create.run(["shared", "-f", "../../test/alice.json"]);
    expect(getSpyResult(spy)).to.contain("Created channel shared");
    channelAddress = getSpyResult(spy).split(":")[1].trim();
    spy.restore();
  });

  describe("id", () => {
    test
      .stdout()
      .command(["id", "-f", "../../test/alice.json"])
      .it("finds did for alice", (ctx) => {
        expect(ctx.stdout).to.contain(
          "did:sol:localnet:32gvm18b2pwWMKUnPFM7tyBctarYt9qGGFtFofb26gUj"
        );
      });

    test
      .stdout()
      .command(["id", "-f", "../../test/bob.json"])
      .it("finds did for bob", (ctx) => {
        expect(ctx.stdout).to.contain(
          "did:sol:localnet:46ZZZjUj7U2wgMPtdxx2v9yVMefgPqJmigNXY61PCpEd\n"
        );
      });
  });

  describe("add-key", () => {
    test
      .stdout()
      .command([
        "add-key",
        "91JwtvZQtK4jGpRMTwssK4Sfc8L9PQY5NKPgM4qGCLep",
        "-n",
        "secondKey",
        "-f",
        "../../test/alice.json",
      ])
      .it("alice adds a new key to her did", (ctx) => {
        expect(ctx.stdout).to.contain("Added key");
      });
  });

  function getSpyResult(spy: sinon.SinonSpy, callNum = 0, argNum = 0) {
    return spy.getCalls()[callNum].args[argNum];
  }

  describe("invite", () => {
    it("invites bob", async () => {
      const spy: sinon.SinonSpy = sinon.spy(console, "log");

      await Invite.run([
        "did:sol:localnet:46ZZZjUj7U2wgMPtdxx2v9yVMefgPqJmigNXY61PCpEd",
        channelAddress,
        "-f",
        "../../test/alice.json",
      ]);

      expect(getSpyResult(spy)).to.contain(
        "Added did:sol:localnet:46ZZZjUj7U2wgMPtdxx2v9yVMefgPqJmigNXY61PCpEd"
      );
      spy.restore();
    });
  });

  describe("post", () => {
    it("posts a message and reads it", async () => {
      const spy: sinon.SinonSpy = sinon.spy(console, "log");

      await Post.run([
        "this is the first message",
        "-c",
        channelAddress,
        "-f",
        "../../test/alice.json",
      ]);

      await Read.run([channelAddress, "-f", "../../test/alice.json"]);

      expect(getSpyResult(spy)).to.contain("this is the first message");
      spy.restore();
    });
  });
});
