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
solarium-cli/0.1.0 darwin-x64 node-v16.0.0
$ solarium --help [COMMAND]
USAGE
  $ solarium COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`solarium add-key [PUBLICKEY]`](#solarium-add-key-publickey)
* [`solarium chat WITH`](#solarium-chat-with)
* [`solarium create NAME`](#solarium-create-name)
* [`solarium help [COMMAND]`](#solarium-help-command)
* [`solarium post [MESSAGE]`](#solarium-post-message)
* [`solarium read [CHANNEL]`](#solarium-read-channel)
* [`solarium watch [CHANNEL]`](#solarium-watch-channel)

## `solarium add-key [PUBLICKEY]`

Add a new key to an existing DID

```
USAGE
  $ solarium add-key [PUBLICKEY]

ARGUMENTS
  PUBLICKEY  A public key in base-58 encoding

OPTIONS
  -h, --help       show CLI help
  -n, --name=name  (required) the key name (e.g. mobileDevice)
```

_See code: [src/commands/add-key.ts](https://github.com/dankelleher/solarium/blob/v0.1.0/src/commands/add-key.ts)_

## `solarium chat WITH`

describe the command here

```
USAGE
  $ solarium chat WITH

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

ALIASES
  $ solarium
```

_See code: [src/commands/chat.ts](https://github.com/dankelleher/solarium/blob/v0.1.0/src/commands/chat.ts)_

## `solarium create NAME`

describe the command here

```
USAGE
  $ solarium create NAME

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/create.ts](https://github.com/dankelleher/solarium/blob/v0.1.0/src/commands/create.ts)_

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

_See code: [src/commands/post.ts](https://github.com/dankelleher/solarium/blob/v0.1.0/src/commands/post.ts)_

## `solarium read [CHANNEL]`

describe the command here

```
USAGE
  $ solarium read [CHANNEL]

OPTIONS
  -h, --help  show CLI help

ALIASES
  $ solarium get
```

_See code: [src/commands/read.ts](https://github.com/dankelleher/solarium/blob/v0.1.0/src/commands/read.ts)_

## `solarium watch [CHANNEL]`

describe the command here

```
USAGE
  $ solarium watch [CHANNEL]

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/watch.ts](https://github.com/dankelleher/solarium/blob/v0.1.0/src/commands/watch.ts)_
<!-- commandsstop -->
