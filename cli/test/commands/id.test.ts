import { expect, test } from "@oclif/test";


describe("id", () => {
  
  before(function() {
    
    var execSync = require('child_process').execSync;
    execSync('solana airdrop 1 BrSACyPFCpXMug2LjWVGSxnHeiFSpZCrFQvFYyMn1f3Q')
  })

  test
    .stdout()
    .command(["id","-f", "../../test/alice.json"])
    .it("looks for alices did and doesn't find it", (ctx) => {
      expect(ctx.stdout).to.contain("You have no DID");
    });
  test
    .stdout()
    .command(["id", "-c", "-f", "../../test/alice.json"])
    .it("creates a new did for alice", (ctx) => {
      expect(ctx.stdout).to.contain("did:sol:localnet:32gvm18b2pwWMKUnPFM7tyBctarYt9qGGFtFofb26gUj");
    });
});
