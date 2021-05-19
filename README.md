
https://docs.solana.com/cli/install-solana-cli-tools

Compile the rust program by going to /program

    cd program
    cargo build-bpf

Compile the sol-did program

    git clone https://github.com/identity-com/sol-did
    cd sol-did/program
    cargo build-bpf

Install the client subproject dependencies:

    cd client
    yarn

Update the client package.json line 20 (start-validator)
with the paths to the compiled sol-did and solarium programs.
 
Start a localnet solana validator in the client subproject

    yarn start-validator

In a different cli, run the e2e tests

    yarn test