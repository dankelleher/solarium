solarium-cli
============

CLI for Solarium: The E2E-encrypted messenger on Solana

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/solarium-cli.svg)](https://npmjs.org/package/solarium-cli)
[![Downloads/week](https://img.shields.io/npm/dw/solarium-cli.svg)](https://npmjs.org/package/solarium-cli)
[![License](https://img.shields.io/npm/l/solarium-cli.svg)](https://github.com/dankelleher/solarium/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g solarium-cli
$ solarium COMMAND
running command...
$ solarium (-v|--version|version)
solarium-cli/0.0.3 darwin-x64 node-v16.0.0
$ solarium --help [COMMAND]
USAGE
  $ solarium COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`solarium create [FILE]`](#solarium-create-file)
* [`solarium help [COMMAND]`](#solarium-help-command)
* [`solarium post [MESSAGE]`](#solarium-post-message)
* [`solarium read [FILE]`](#solarium-read-file)
* [`solarium watch [FILE]`](#solarium-watch-file)

## `solarium create [FILE]`

describe the command here

```
USAGE
  $ solarium create [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/create.ts](https://github.com/dankelleher/solarium/blob/v0.0.3/src/commands/create.ts)_

## `solarium help [COMMAND]`

display help for solarium

```
USAGE
  $ solarium help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `solarium post [MESSAGE]`

describe the command here

```
USAGE
  $ solarium post [MESSAGE]

OPTIONS
  -h, --help                 show CLI help
  -i, --from-stdin
  -r, --recipient=recipient  (required) Recipient DID
```

_See code: [src/commands/post.ts](https://github.com/dankelleher/solarium/blob/v0.0.3/src/commands/post.ts)_

## `solarium read [FILE]`

describe the command here

```
USAGE
  $ solarium read [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

ALIASES
  $ solarium get
  $ solarium
```

_See code: [src/commands/read.ts](https://github.com/dankelleher/solarium/blob/v0.0.3/src/commands/read.ts)_

## `solarium watch [FILE]`

describe the command here

```
USAGE
  $ solarium watch [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/watch.ts](https://github.com/dankelleher/solarium/blob/v0.0.3/src/commands/watch.ts)_
<!-- commandsstop -->
