<!-- badges-start -->

[![Black Lives Matter!][x-badge-blm-image]][x-badge-blm-link]
[![Last commit timestamp][x-badge-lastcommit-image]][x-badge-repo-link]
[![Codecov][x-badge-codecov-image]][x-badge-codecov-link]
[![Source license][x-badge-license-image]][x-badge-license-link]
[![Monthly Downloads][x-badge-downloads-image]][x-badge-npm-link]
[![NPM version][x-badge-npm-image]][x-badge-npm-link]
[![Uses Semantic Release!][x-badge-semanticrelease-image]][x-badge-semanticrelease-link]

<!-- badges-end -->

# xunnctl

This is a highly-opinionated personal tool for interacting with various
disparate networks, systems, and other resources of interest to me.

These used to be several CLIs, but the time has come to bring them together!

---

<!-- remark-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Install](#install)
- [Usage](#usage)
  - [`xunnctl` (Entry Point)](#xunnctl-entry-point)
  - [`xunnctl config`](#xunnctl-config)
  - [`xunnctl config get`](#xunnctl-config-get)
  - [`xunnctl config set`](#xunnctl-config-set)
  - [`xunnctl config unset`](#xunnctl-config-unset)
  - [`xunnctl dns record create A`](#xunnctl-dns-record-create-a)
  - [`xunnctl dns record create AAAA`](#xunnctl-dns-record-create-aaaa)
  - [`xunnctl dns record create CAA`](#xunnctl-dns-record-create-caa)
  - [`xunnctl dns record create CNAME`](#xunnctl-dns-record-create-cname)
  - [`xunnctl dns record create MX`](#xunnctl-dns-record-create-mx)
  - [`xunnctl dns record create TXT`](#xunnctl-dns-record-create-txt)
  - [`xunnctl dns record retrieve`](#xunnctl-dns-record-retrieve)
  - [`xunnctl dns record destroy`](#xunnctl-dns-record-destroy)
  - [`xunnctl dns zone`](#xunnctl-dns-zone)
  - [`xunnctl dns zone create`](#xunnctl-dns-zone-create)
  - [`xunnctl dns zone retrieve`](#xunnctl-dns-zone-retrieve)
  - [`xunnctl dns zone update`](#xunnctl-dns-zone-update)
  - [`xunnctl dns zone destroy`](#xunnctl-dns-zone-destroy)
  - [`xunnctl firewall`](#xunnctl-firewall)
  - [`xunnctl firewall ban`](#xunnctl-firewall-ban)
  - [`xunnctl firewall status`](#xunnctl-firewall-status)
  - [`xunnctl firewall unban`](#xunnctl-firewall-unban)
  - [`xunnctl raw`](#xunnctl-raw)
  - [`xunnctl super install`](#xunnctl-super-install)
  - [`xunnctl super uninstall`](#xunnctl-super-uninstall)
- [Appendix](#appendix)
  - [Published Package Details](#published-package-details)
  - [License](#license)
- [Contributing and Support](#contributing-and-support)
  - [Contributors](#contributors)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- remark-ignore-end -->

## Install

You can install this package globally:

```shell
npm install --global @-xun/ctl
```

And then execute the CLI:

```shell
npx xunnctl ...
```

Alternatively, you can use npx to execute the CLI without pre-installation:

```shell
npx @-xun/ctl ...
```

## Usage

> Be careful running commands with huge footprints (e.g. using the
> `--apex-all-known` parameter) in quick succession. Take note of the [rate
> limits][1] for the APIs you're invoking.

For first time usage, or if credentials are inaccessible, you will be prompted
to enter your credentials, which will be saved [locally][2]. You can do this
manually at any time via [`xunnctl config set`][3].

From there, you can begin issuing commands. Commands are organized
hierarchically, starting with the bare `xunnctl` command at the root. For the
most up-to-date list of available commands and flags, use `xunnctl ... --help`.

You can also use the `xctl` and `x` aliases, e.g. `x --help`. Most commands also
have a single-letter alias, which is always the first letter of that command.

There are many individual commands available, each with their own accepted
parameters and help text. These commands also share several standard parameters
which can be found in the following table:

|                     |      Name       |  Type   |           Default           | Description                                                                                                    |
| :-----------------: | :-------------: | :-----: | :-------------------------: | :------------------------------------------------------------------------------------------------------------- |
| <sub>optional</sub> | `--config-path` | string  | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                      |
| <sub>optional</sub> |    `--help`     | boolean |          undefined          | Show command-specific help text. Cannot be used with other parameters or sub-commands.                         |
| <sub>optional</sub> |    `--hush`     | boolean |            false            | The program output will be somewhat less verbose than usual.                                                   |
| <sub>optional</sub> |    `--quiet`    | boolean |            false            | The program output will be dramatically less verbose than usual. Implies (and takes precedence over) `--hush`. |
| <sub>optional</sub> |   `--silent`    | boolean |            false            | The program will not output anything at all. Implies (and takes precedence over) `--quiet` and `--hush`.       |

Some commands have an additional `--force` parameter that is required whenever
an exceedingly dangerous operation is requested. While present in help text
output, this parameter will not be mentioned in this documentation going
forward.

Currently, the available commands are:

### `xunnctl` (Entry Point)

> Alias: `xctl`, `x`

This command is the entry point into the CLI and as such can be used to retrieve
metadata about the `xunnctl` software itself, including the currently installed
version number.

#### Examples

```bash
xunnctl --version
xctl --version
x --version
```

#### Parameters

|                     |    Name     |  Type   |  Default  | Description                                                                |
| :-----------------: | :---------: | :-----: | :-------: | :------------------------------------------------------------------------- |
| <sub>optional</sub> | `--version` | boolean | undefined | Show version number. Cannot be used with other parameters or sub-commands. |

### `xunnctl config`

> Alias: `x c`

This command, unless called with `--help`, is an alias for
[`xunnctl config get --all`][4].

#### Examples

```bash
xunnctl config
x c
```

#### Parameters

See [`xunnctl config get`][4].

### `xunnctl config get`

> Alias: `x c g`

This command dumps the value of one or more `xunnctl` configuration options
straight to stdout without additional outputs, making it suitable for use in
scripts. These values are stored [locally][2] and protected with `0660`
permissions.

See [here][5] for a list of available configuration options.

When called without any arguments, this command is an alias for
`xunnctl config get --all`.

#### Examples

```bash
xunnctl config get --sub-name cfApiToken
x c g --sub-name cfApiToken cfAccountId
x c g --sub-name cfApiToken --sub-name cfAccountId
# The next two lines are equivalent
x c g --all
x c g
```

#### Parameters

|                     |     Name     |   Type    |  Default  | Description                                                                                          |
| :-----------------: | :----------: | :-------: | :-------: | :--------------------------------------------------------------------------------------------------- |
| <sub>optional</sub> |   `--all`    |  boolean  | undefined | Dump the current value of all configuration options. Cannot be used with the `--sub-name` parameter. |
| <sub>optional</sub> | `--sub-name` | string\[] | undefined | The names of one or more options to retrieve. Cannot be used with the `--all` parameter.             |

### `xunnctl config set`

> Alias: `x c s`

This command updates the value of the `--sub-name` configuration option to
`--content`, which is a valid JSON value. This includes double quotes if it's a
string.

This value is stored [locally][2] and protected with `0660` permissions.

Note that `--content` can be any value JSON value, and that **updating an option
with the wrong value or type of value will cause undefined behavior**. See
[here][5] for a list of available configuration options and their valid values.

#### Examples

```bash
xunnctl config set --sub-name cfApiToken --content AbCd1234
x c s --sub-name cfApiToken --content AbCd1234
```

#### Parameters

|                         |     Name     |                       Type                        |  Default  | Description                                                             |
| :---------------------: | :----------: | :-----------------------------------------------: | :-------: | :---------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** | `--content`  | string<br /><sub>(unescaped spaces allowed)</sub> | undefined | The new value of the option to update. This must be a valid JSON value. |
| **<sub>REQUIRED</sub>** | `--sub-name` |                      string                       | undefined | The name of the option to update.                                       |

### `xunnctl config unset`

> Alias: `x c u`

This command deletes the configuration entry (name and content) associated with
the `--sub-name` configuration option and commits the change to the filesystem.

#### Examples

```bash
xunnctl config unset --sub-name cfApiToken
x c u --sub-name cfApiToken
```

#### Parameters

|                     |     Name     |   Type    |  Default  | Description                                                                                   |
| :-----------------: | :----------: | :-------: | :-------: | :-------------------------------------------------------------------------------------------- |
| <sub>optional</sub> |   `--all`    |  boolean  | undefined | Delete all options in the configuration file. Cannot be used with the `--sub-name` parameter. |
| <sub>optional</sub> | `--sub-name` | string\[] | undefined | The names of one or more options to delete. Cannot be used with the `--all` parameter.        |

### `xunnctl dns record create A`

> Alias: `x d r c a`

This command creates a new DNS A resource record in one or more existing zones.

#### Examples

```bash
xunnctl dns record create a --apex xunn.io --sub-name @ --ipv4 1.2.3.4 --proxied=false
x d r c A --apex xunn.io --sub-name 'something.else' --ipv4 1.2.3.4
```

#### Parameters

|                                        |        Name        |   Type    |  Default  | Description                                                                                       |
| :------------------------------------: | :----------------: | :-------: | :-------: | :------------------------------------------------------------------------------------------------ |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                      |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |  boolean  | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.                 |
|        **<sub>REQUIRED</sub>**         |      `--ipv4`      |  string   | undefined | A valid IPv4 address.                                                                             |
|        **<sub>REQUIRED</sub>**         |    `--sub-name`    |  string   | undefined | The DNS record name in Punycode, or the character "@", but excluding the apex domain as a suffix. |
|          <sub>optional</sub>           |    `--proxied`     |  boolean  |   false   | Whether the record is receiving the performance and security benefits of Cloudflare.              |

### `xunnctl dns record create AAAA`

> Alias: `x d r c aaaa`

This command creates a new DNS AAAA resource record in one or more existing
zones.

#### Examples

```bash
xunnctl dns record create aaaa --apex xunn.io --sub-name @ --ipv6 ::ffff:1.2.3.4 --proxied=false
x d r c AAAA --apex xunn.io --sub-name 'something.else' --ipv6 2001:db8::8a2e:7334
```

#### Parameters

|                                        |        Name        |   Type    |  Default  | Description                                                                                       |
| :------------------------------------: | :----------------: | :-------: | :-------: | :------------------------------------------------------------------------------------------------ |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                      |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |  boolean  | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.                 |
|        **<sub>REQUIRED</sub>**         |      `--ipv6`      |  string   | undefined | A valid IPv6 address.                                                                             |
|        **<sub>REQUIRED</sub>**         |    `--sub-name`    |  string   | undefined | The DNS record name in Punycode, or the character "@", but excluding the apex domain as a suffix. |
|          <sub>optional</sub>           |    `--proxied`     |  boolean  |   false   | Whether the record is receiving the performance and security benefits of Cloudflare.              |

### `xunnctl dns record create CAA`

> Alias: `x d r c caa`

This command creates pre-configured "issue" and "iodef" CAA resource records in
one or more existing zones.

#### Examples

```bash
xunnctl dns record create caa --apex xunn.io
x d r c CAA --apex xunn.io --apex xunn.at
```

#### Parameters

|                                        |        Name        |   Type    |  Default  | Description                                                                       |
| :------------------------------------: | :----------------: | :-------: | :-------: | :-------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.      |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |  boolean  | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters. |

### `xunnctl dns record create CNAME`

> Alias: `x d r c cname`

This command creates a new DNS CNAME resource record in one or more existing
zones.

#### Examples

```bash
xunnctl dns record create cname --apex xunn.io --sub-name 'sub.domain' --to-name 'diff.com'
x d r c CNAME --apex xunn.io --apex xunn.at --sub-name 'sub.domain' --to-name 'diff.com'
```

#### Parameters

|                                        |        Name        |   Type    |  Default  | Description                                                                                       |
| :------------------------------------: | :----------------: | :-------: | :-------: | :------------------------------------------------------------------------------------------------ |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                      |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |  boolean  | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.                 |
|        **<sub>REQUIRED</sub>**         |    `--sub-name`    |  string   | undefined | The DNS record name in Punycode, or the character "@", but excluding the apex domain as a suffix. |
|        **<sub>REQUIRED</sub>**         |    `--to-name`     |  string   | undefined | A valid fully-qualified hostname. Must not match the record's name.                               |
|          <sub>optional</sub>           |    `--proxied`     |  boolean  |   false   | Whether the record is receiving the performance and security benefits of Cloudflare.              |

### `xunnctl dns record create MX`

> Alias: `x d r c mx`

This command creates a new DNS MX resource record in one or more existing zones.

#### Examples

```bash
xunnctl dns record create mx --apex xunn.io --sub-name '@' --mail-name 'mail.xunn.io'
x d r c MX --apex xunn.io --apex xunn.at --sub-name 'something.else' --mail-name 'mail.xunn.io'
```

#### Parameters

|                                        |        Name        |   Type    |  Default  | Description                                                                                       |
| :------------------------------------: | :----------------: | :-------: | :-------: | :------------------------------------------------------------------------------------------------ |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                      |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |  boolean  | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.                 |
|        **<sub>REQUIRED</sub>**         |    `--sub-name`    |  string   | undefined | The DNS record name in Punycode, or the character "@", but excluding the apex domain as a suffix. |
|        **<sub>REQUIRED</sub>**         |   `--mail-name`    |  string   | undefined | A valid fully-qualified mail server hostname.                                                     |

### `xunnctl dns record create TXT`

> Alias: `x d r c txt`

This command creates a new DNS TXT resource record in one or more existing
zones.

#### Examples

```bash
xunnctl dns record create txt --apex xunn.io --sub-name @ --content '...'
x d r c TXT --apex xunn.io --apex xunn.at --sub-name 'something.else' --content '...'
```

#### Parameters

|                                        |        Name        |   Type    |  Default  | Description                                                                                       |
| :------------------------------------: | :----------------: | :-------: | :-------: | :------------------------------------------------------------------------------------------------ |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                      |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |  boolean  | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.                 |
|        **<sub>REQUIRED</sub>**         |    `--sub-name`    |  string   | undefined | The DNS record name in Punycode, or the character "@", but excluding the apex domain as a suffix. |
|        **<sub>REQUIRED</sub>**         |    `--content`     |  string   | undefined | Text content for the record.                                                                      |

### `xunnctl dns record retrieve`

> Alias: `x d r r`

This command retrieves one or more resource records of name `--target-name`
and/or of type `--target-type` from the specified `--apex*` DNS zone(s). If
`--search-for-name` is given, `--target-name` will be matched partially (via
`startsWith()`) rather than exactly.

Omitting both `--target-name` and `--target-type` will retrieve all records.

The result can be queried via `--local-query`, which accepts a [JMESPath][6]
value. Note that, as a feature, the presence of spaces in the query does not
necessitate quoting or escaping. When `--local-query` is present, the resulting
JSON will be dumped straight to stdout.

#### Examples

```bash
xunnctl dns record retrieve --apex xunn.io --target-name mail --target-type CNAME
x d r r --apex-all-known --apex new-site.com --target-name mail
x d r r --apex xunn.io --apex xunn.at --target-type cname --local-query id
```

#### Parameters

|                                        |        Name         |                       Type                        |  Default  | Description                                                                                                                        |
| :------------------------------------: | :-----------------: | :-----------------------------------------------: | :-------: | :--------------------------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`       |                     string\[]                     | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                                                       |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known`  |                      boolean                      | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.                                                  |
|          <sub>optional</sub>           |   `--target-name`   |                      string                       | undefined | The target DNS record name in Punycode, including the apex domain as a suffix. Note that the "@" character is not recognized here. |
|          <sub>optional</sub>           |   `--target-type`   |                      string                       | undefined | Case-insensitive DNS record type, such as `AAAA` or `mx`.                                                                          |
|          <sub>optional</sub>           |   `--local-query`   | string<br /><sub>(unescaped spaces allowed)</sub> | undefined | A [JMESPath][6] query string. Unescaped spaces are preserved in CLI. The resulting JSON will be dumped straight to stdout.         |
|          <sub>optional</sub>           | `--search-for-name` |                   boolean<br />                   |   false   | Match names _starting with_ `--target-name` instead of matching said names _exactly_, which is the default behavior.               |

### `xunnctl dns record destroy`

> Alias: `x d r d`

This command irrecoverably destroys one or more resource records that are named
`--target-name` and are of type `--target-type` from the specified `--apex*` DNS
zone(s). If no such record(s) exist, this command is a no-op.

If `--search-for-name` is given, `--target-name` will be matched partially (via
`startsWith()`) rather than exactly.

#### Examples

```bash
xunnctl dns record destroy --apex dangerous.com --target-name some.specific.record --target-type CNAME
xunnctl d r d --apex dangerous.com --target-name some.specific.record --target-type cname
```

#### Parameters

|                                        |        Name         |     Type      |  Default  | Description                                                                                                                        |
| :------------------------------------: | :-----------------: | :-----------: | :-------: | :--------------------------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`       |   string\[]   | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                                                       |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known`  |    boolean    | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters. **Note that this is incredibly dangerous!**      |
|        **<sub>REQUIRED</sub>**         |   `--target-name`   |    string     | undefined | The target DNS record name in Punycode, including the apex domain as a suffix. Note that the "@" character is not recognized here. |
|        **<sub>REQUIRED</sub>**         |   `--target-type`   |    string     | undefined | Case-insensitive DNS record type, such as `AAAA` or `mx`.                                                                          |
|          <sub>optional</sub>           | `--search-for-name` | boolean<br /> |   false   | Match names _starting with_ `--target-name` instead of matching said names _exactly_, which is the default behavior.               |

### `xunnctl dns zone`

> Alias: `x d z`

This command, unless called with `--help`, is an alias for
[`xunnctl dns zone retrieve --apex-all-known`][7].

#### Examples

```bash
xunnctl dns zone
x d z
```

#### Parameters

See [`xunnctl dns zone retrieve`][7].

### `xunnctl dns zone create`

> Alias: `x d z c`

This command creates and initializes a new DNS `--apex` zone. If a conflicting
apex zone already exists, this command will fail. If you're trying to bring an
existing zone up to current configuration standards, see
[`xunnctl dns zone update`][8] instead.

#### Examples

```bash
xunnctl dns zone create --apex xunn.at
x d z c --apex xunn.at
```

#### Parameters

|                         |   Name   |   Type    |  Default  | Description                                                                  |
| :---------------------: | :------: | :-------: | :-------: | :--------------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** | `--apex` | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters. |

### `xunnctl dns zone retrieve`

> Alias: `x d z r`

This command returns information about one or more `--apex` zones.

The result can be queried via `--local-query`, which accepts a [JMESPath][6]
value. Note that, as a feature, the presence of spaces in the query does not
necessitate quoting or escaping. When `--local-query` is present, the resulting
JSON will be dumped straight to stdout.

#### Examples

```bash
xunnctl dns zone retrieve --apex xunn.at
x d z r --apex-all-known --apex new-site.com --local-query id
x d z r --apex xunn.io --apex xunn.at --local-query { id: id, cdnOnly: meta.cdn_only }
```

#### Parameters

|                                        |        Name        |                       Type                        |  Default  | Description                                                                                                                |
| :------------------------------------: | :----------------: | :-----------------------------------------------: | :-------: | :------------------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      |                     string\[]                     | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.                                               |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |                      boolean                      | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.                                          |
|          <sub>optional</sub>           |  `--local-query`   | string<br /><sub>(unescaped spaces allowed)</sub> | undefined | A [JMESPath][6] query string. Unescaped spaces are preserved in CLI. The resulting JSON will be dumped straight to stdout. |

### `xunnctl dns zone update`

> Alias: `x d z u`

This command is equivalent to [`xunnctl dns zone create`][9] but for zones that
already exist. It will attempt to bring one or more zones up to date with the
latest best practices with respect to zone configuration; any failures thrown
when attempting to create records, while reported, are ignored. No records are
deleted or updated, only creations will be attempted.

#### Examples

```bash
xunnctl dns zone update --apex-all-known
x d z u --apex xunn.at --apex xunn.io
```

#### Parameters

|                                        |        Name        |   Type    |  Default  | Description                                                                             |
| :------------------------------------: | :----------------: | :-------: | :-------: | :-------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/2</sup></sub>** |      `--apex`      | string\[] | undefined | Zero or more zone apex domains. Can be used with other `--apex*` parameters.            |
| **<sub>REQUIRED <sup>2/2</sup></sub>** | `--apex-all-known` |  boolean  | undefined | Include all known zone apex domains. Can be used with other `--apex*` parameters.       |
|          <sub>optional</sub>           |  `--purge-first`   |  boolean  | undefined | Delete pertinent records on the zone before recreating them. **This can be dangerous!** |

### `xunnctl dns zone destroy`

> Alias: `x d z d`

This command irrecoverably destroys a DNS `--apex` zone. If no such zone exists,
this command is a no-op.

#### Examples

```bash
xunnctl dns zone destroy --apex be-careful.org
x d z d --apex dangerous.com
```

#### Parameters

|                         |   Name   |  Type  |  Default  | Description                |
| :---------------------: | :------: | :----: | :-------: | :------------------------- |
| **<sub>REQUIRED</sub>** | `--apex` | string | undefined | An apex domain to destroy. |

### `xunnctl firewall`

> Alias: `x f`

This command, unless called with `--help`, is an alias for
[`xunnctl firewall status`][10].

#### Examples

```bash
xunnctl firewall
x f
```

#### Parameters

See [`xunnctl firewall status`][10].

### `xunnctl firewall ban`

> Alias: `x f b`

This command adds an ip address to the global hostile ip list, which is a
[Cloudflare WAF List][11]. No managed system will accept packets coming from an
IP on this list.

All [IP formats supported by Cloudflare WAF Lists][12] are supported.
Additionally, full ipv6 addresses will be translated into the supported ipv6
CIDR double colon notation.

#### Examples

```bash
xunnctl firewall ban --ip 1.2.3.4 --ip 5.6.7.8
# Cloudflare doesn't support the following, but this CLI does:
x f b --ip 2600:8800:51a1:1234:5678:9101:2007:76eb
```

#### Parameters

|                         |  Name  |   Type    |  Default  | Description                                                                                                                                                                  |
| :---------------------: | :----: | :-------: | :-------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** | `--ip` | string\[] | undefined | One or more IP addresses to ban. All IP formats supported by [Cloudflare WAF Lists][11] are supported here. Full ipv6 addresses are also supported (converted to /64 CIDRs). |

### `xunnctl firewall status`

> Alias: `x f s`

This command returns the contents of the global hostile ip list, which is a
[Cloudflare WAF List][11]. No managed system will accept packets coming from an
IP on this list.

All [IP formats supported by Cloudflare WAF Lists][12] are supported.
Additionally, full ipv6 addresses will be translated into the supported ipv6
CIDR double colon notation.

#### Examples

```bash
xunnctl firewall status
x f s --ip 5.6.7.8 --ip 2600:8800:51a1:1234:5678:9101:2007:76eb
```

#### Parameters

|                     |  Name  |   Type    |  Default  | Description                                                                                                                                                                        |
| :-----------------: | :----: | :-------: | :-------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <sub>optional</sub> | `--ip` | string\[] | undefined | One or more IP addresses to report on. All IP formats supported by [Cloudflare WAF Lists][11] are supported here. Full ipv6 addresses are also supported (converted to /64 CIDRs). |

### `xunnctl firewall unban`

> Alias: `x f u`

This command removes an ip address from the global hostile ip list, which is a
[Cloudflare WAF List][11]. No managed system will accept packets coming from an
IP on this list.

All [IP formats supported by Cloudflare WAF Lists][12] are supported.
Additionally, full ipv6 addresses will be translated into the supported ipv6
CIDR double colon notation.

#### Examples

```bash
xunnctl firewall unban --ip 1.2.3.4 --ip 5.6.7.8
# Cloudflare doesn't support the following, but this CLI does:
x f u --ip 2600:8800:51a1:1234:5678:9101:2007:76eb
```

#### Parameters

|                         |          Name           |   Type    |  Default  | Description                                                                                                                                                                  |
| :---------------------: | :---------------------: | :-------: | :-------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** |         `--ip`          | string\[] | undefined | One or more IP address to unban. All IP formats supported by [Cloudflare WAF Lists][11] are supported here. Full ipv6 addresses are also supported (converted to /64 CIDRs). |
|   <sub>optional</sub>   | `--if-comment-excludes` |  string   | undefined | Only unban if `--ip`'s comment does not include the given text.                                                                                                              |

### `xunnctl raw`

> Alias: `x r`

This command will dump freeform data into stdout depending on `--id` and without
additional outputs, making it suitable for use in scripts.

The following values for `--id` are supported:

#### `conf.nginx.allowOnlyCloudflare`

This is an nginx configuration file consisting of directives that, when included
in an server context, will cause nginx to reject all connection attempts from IP
addresses that do not belong to Cloudflare.

When using this ID, you can also pipe in the contents of an nginx configuration
file and it will be included in the output with respect for the lines consisting
of `### START AUTOGENERATED RULES` and `### END AUTOGENERATED RULES`. For
example:

```text
echo 'before\n### START AUTOGENERATED RULES\n\nx\ny\nz\n\n### END AUTOGENERATED RULES\nafter\n' | npx x r --id conf.nginx.allowOnlyCloudflare
```

Note that `deny all;` should be included in your Nginx configuration for it to
be meaningful. This tool will not add it for you. For example:

```text
...
### START AUTOGENERATED RULES
...
### END AUTOGENERATED RULES

allow 127.0.0.0/8;
allow ::1/128;
deny all;
```

#### Examples

```bash
xunnctl raw --id conf.nginx.allowOnlyCloudflare
x r --id conf.nginx.allowOnlyCloudflare
```

#### Parameters

|                         |  Name  |  Type  |  Default  | Description                                     |
| :---------------------: | :----: | :----: | :-------: | :---------------------------------------------- |
| **<sub>REQUIRED</sub>** | `--id` | string | undefined | The identifier associated with the target data. |

### `xunnctl super install`

> Alias: `x s i`

This command will install several privileged commands from a private repository.
These commands will be dynamically added to xunnctl, potentially updating
existing commands in the process, thus greatly expanding the available commands
beyond those listed in this documentation.

This command is idempotent so long as the contents of said private repository
remain unchanged. Running this command after said repository has been updated
will install the updates but will not synchronize deletes.

To completely clear out installed commands, see [`xunnctl super uninstall`][13].

#### Examples

```bash
xunnctl super install
x s i
```

#### Parameters

This command does not accept additional parameters.

### `xunnctl super uninstall`

> Alias: `x s u`

This command will completely uninstall any command that has ever been downloaded
and installed by `xunnctl super install`. Downloaded commands that overwrote
their public versions will be reverted.

To reinstall all available privileged commands, see
[`xunnctl super install`][14]

#### Examples

```bash
xunnctl super uninstall
x s u
```

#### Parameters

This command does not accept additional parameters.

## Appendix

Further documentation can be found under [`docs/`][x-repo-docs].

### Published Package Details

This is a [CJS2 package][x-pkg-cjs-mojito] with statically-analyzable exports
built by Babel for Node.js versions that are not end-of-life. For TypeScript
users, this package supports both `"Node10"` and `"Node16"` module resolution
strategies.

<details><summary>Expand details</summary>

That means both CJS2 (via `require(...)`) and ESM (via `import { ... } from ...`
or `await import(...)`) source will load this package from the same entry points
when using Node. This has several benefits, the foremost being: less code
shipped/smaller package size, avoiding [dual package
hazard][x-pkg-dual-package-hazard] entirely, distributables are not
packed/bundled/uglified, a drastically less complex build process, and CJS
consumers aren't shafted.

Each entry point (i.e. `ENTRY`) in [`package.json`'s
`exports[ENTRY]`][x-repo-package-json] object includes one or more [export
conditions][x-pkg-exports-conditions]. These entries may or may not include: an
[`exports[ENTRY].types`][x-pkg-exports-types-key] condition pointing to a type
declarations file for TypeScript and IDEs, an
[`exports[ENTRY].module`][x-pkg-exports-module-key] condition pointing to
(usually ESM) source for Webpack/Rollup, an `exports[ENTRY].node` condition
pointing to (usually CJS2) source for Node.js `require` _and `import`_, an
`exports[ENTRY].default` condition pointing to source for browsers and other
environments, and [other conditions][x-pkg-exports-conditions] not enumerated
here. Check the [package.json][x-repo-package-json] file to see which export
conditions are supported.

Though [`package.json`][x-repo-package-json] includes
[`{ "type": "commonjs" }`][x-pkg-type], note that any ESM-only entry points will
be ES module (`.mjs`) files. Finally, [`package.json`][x-repo-package-json] also
includes the [`sideEffects`][x-pkg-side-effects-key] key, which is `false` for
optimal [tree shaking][x-pkg-tree-shaking] where appropriate.

</details>

### License

See [LICENSE][x-repo-license].

## Contributing and Support

**[New issues][x-repo-choose-new-issue] and [pull requests][x-repo-pr-compare]
are always welcome and greatly appreciated! 🤩** Just as well, you can [star 🌟
this project][x-badge-repo-link] to let me know you found it useful! ✊🏿 Or you
could [buy me a beer][x-repo-sponsor] 🥺Thank you!

See [CONTRIBUTING.md][x-repo-contributing] and [SUPPORT.md][x-repo-support] for
more information.

### Contributors

<!-- remark-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- remark-ignore-end -->

Thanks goes to these wonderful people ([emoji
key][x-repo-all-contributors-emojis]):

<!-- remark-ignore-start -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://xunn.io/"><img src="https://avatars.githubusercontent.com/u/656017?v=4?s=100" width="100px;" alt="Bernard"/><br /><sub><b>Bernard</b></sub></a><br /><a href="#infra-Xunnamius" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/Xunnamius/xunnctl/commits?author=Xunnamius" title="Code">💻</a> <a href="https://github.com/Xunnamius/xunnctl/commits?author=Xunnamius" title="Documentation">📖</a> <a href="#maintenance-Xunnamius" title="Maintenance">🚧</a> <a href="https://github.com/Xunnamius/xunnctl/commits?author=Xunnamius" title="Tests">⚠️</a> <a href="https://github.com/Xunnamius/xunnctl/pulls?q=is%3Apr+reviewed-by%3AXunnamius" title="Reviewed Pull Requests">👀</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- remark-ignore-end -->

This project follows the [all-contributors][x-repo-all-contributors]
specification. Contributions of any kind welcome!

[x-badge-blm-image]: https://xunn.at/badge-blm 'Join the movement!'
[x-badge-blm-link]: https://xunn.at/donate-blm
[x-badge-codecov-image]:
  https://img.shields.io/codecov/c/github/Xunnamius/xunnctl/main?style=flat-square&token=HWRIOBAAPW
  'Is this package well-tested?'
[x-badge-codecov-link]: https://codecov.io/gh/Xunnamius/xunnctl
[x-badge-downloads-image]:
  https://img.shields.io/npm/dm/@-xun/ctl?style=flat-square
  'Number of times this package has been downloaded per month'
[x-badge-lastcommit-image]:
  https://img.shields.io/github/last-commit/xunnamius/xunnctl?style=flat-square
  'Latest commit timestamp'
[x-badge-license-image]:
  https://img.shields.io/npm/l/@-xun/ctl?style=flat-square
  "This package's source license"
[x-badge-license-link]: https://github.com/Xunnamius/xunnctl/blob/main/LICENSE
[x-badge-npm-image]:
  https://xunn.at/npm-pkg-version/@-xun/ctl
  'Install this package using npm or yarn!'
[x-badge-npm-link]: https://npmtrends.com/@-xun/ctl
[x-badge-repo-link]: https://github.com/xunnamius/xunnctl
[x-badge-semanticrelease-image]:
  https://xunn.at/badge-semantic-release
  'This repo practices continuous integration and deployment!'
[x-badge-semanticrelease-link]:
  https://github.com/semantic-release/semantic-release
[x-pkg-cjs-mojito]:
  https://dev.to/jakobjingleheimer/configuring-commonjs-es-modules-for-nodejs-12ed#publish-only-a-cjs-distribution-with-property-exports
[x-pkg-dual-package-hazard]:
  https://nodejs.org/api/packages.html#dual-package-hazard
[x-pkg-exports-conditions]:
  https://webpack.js.org/guides/package-exports#reference-syntax
[x-pkg-exports-module-key]:
  https://webpack.js.org/guides/package-exports#providing-commonjs-and-esm-version-stateless
[x-pkg-exports-types-key]:
  https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta#packagejson-exports-imports-and-self-referencing
[x-pkg-side-effects-key]:
  https://webpack.js.org/guides/tree-shaking#mark-the-file-as-side-effect-free
[x-pkg-tree-shaking]: https://webpack.js.org/guides/tree-shaking
[x-pkg-type]:
  https://github.com/nodejs/node/blob/8d8e06a345043bec787e904edc9a2f5c5e9c275f/doc/api/packages.md#type
[x-repo-all-contributors]: https://github.com/all-contributors/all-contributors
[x-repo-all-contributors-emojis]: https://allcontributors.org/docs/en/emoji-key
[x-repo-choose-new-issue]:
  https://github.com/xunnamius/xunnctl/issues/new/choose
[x-repo-contributing]: /CONTRIBUTING.md
[x-repo-docs]: docs
[x-repo-license]: ./LICENSE
[x-repo-package-json]: package.json
[x-repo-pr-compare]: https://github.com/xunnamius/xunnctl/compare
[x-repo-sponsor]: https://github.com/sponsors/Xunnamius
[x-repo-support]: /.github/SUPPORT.md
[1]: https://developers.cloudflare.com/fundamentals/api/reference/limits
[2]: https://github.com/sindresorhus/env-paths
[3]: #xunnctl-config-set
[4]: #xunnctl-config-get
[5]: ./docs/modules/config_manager.md#config
[6]: https://jmespath.org/tutorial.html
[7]: #xunnctl-dns-zone-retrieve
[8]: #xunnctl-dns-zone-update
[9]: #xunnctl-dns-zone-create
[10]: #xunnctl-firewall-status
[11]: https://developers.cloudflare.com/waf/tools/lists
[12]: https://developers.cloudflare.com/waf/tools/lists/custom-lists#ip-lists
[13]: #xunnctl-super-uninstall
[14]: #xunnctl-super-install
