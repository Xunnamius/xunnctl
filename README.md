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

As a README-driven developer, I start all my projects by writing up
documentation, even if I'm the only one who will ever read it!

---

<!-- remark-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Install](#install)
- [Usage](#usage)
  - [`xunnctl`](#xunnctl)
  - [`xunnctl config`](#xunnctl-config)
  - [`xunnctl config get`](#xunnctl-config-get)
  - [`xunnctl config set`](#xunnctl-config-set)
  - [`xunnctl dns record`](#xunnctl-dns-record)
  - [`xunnctl dns record create A`](#xunnctl-dns-record-create-a)
  - [`xunnctl dns record create AAAA`](#xunnctl-dns-record-create-aaaa)
  - [`xunnctl dns record create CAA`](#xunnctl-dns-record-create-caa)
  - [`xunnctl dns record create CNAME`](#xunnctl-dns-record-create-cname)
  - [`xunnctl dns record create MX`](#xunnctl-dns-record-create-mx)
  - [`xunnctl dns record create TXT`](#xunnctl-dns-record-create-txt)
  - [`xunnctl dns record retrieve`](#xunnctl-dns-record-retrieve)
  - [`xunnctl dns zone`](#xunnctl-dns-zone)
  - [`xunnctl dns zone create`](#xunnctl-dns-zone-create)
  - [`xunnctl dns zone retrieve`](#xunnctl-dns-zone-retrieve)
  - [`xunnctl dns zone update`](#xunnctl-dns-zone-update)
  - [`xunnctl firewall`](#xunnctl-firewall)
  - [`xunnctl firewall ban`](#xunnctl-firewall-ban)
  - [`xunnctl firewall status`](#xunnctl-firewall-status)
  - [`xunnctl firewall unban`](#xunnctl-firewall-unban)
  - [`xunnctl raw`](#xunnctl-raw)
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
npm install --global xunnctl
```

Alternatively, you can use npx to call this package without pre-installation:

```shell
npx xunnctl ...
```

## Usage

For first time usage, or if credentials are inaccessible, you will be prompted
to enter your credentials, which will be saved [locally][1]. You can do this
manually at any time via [`xunnctl config set`][2].

From there, you can begin issuing commands. For the most up-to-date list of
available commands and flags, use `xunnctl ... --help`.

You can also use the `xctl` and `x` aliases, e.g. `x --help`. Most commands also
have a single-letter alias, which is always the first letter of that command.

There are many individual commands available, each with their own accepted
parameters and help text. Commands are organized hierarchically, starting with
the bare `xunnctl` command at the root.

### `xunnctl`

> Alias: `xctl`, `x`

This command can be used to retrieve metadata about the `xunnctl` software
itself, such as the currently installed version number.

##### Examples

```bash
xunnctl --version
xctl --version
x --version
```

##### Parameters

|                     |    Name     |  Type   |  Default  | Description                                                                |
| :-----------------: | :---------: | :-----: | :-------: | :------------------------------------------------------------------------- |
| <sub>optional</sub> |  `--help`   | boolean | undefined | Show help text. Cannot be used with other parameters or sub-commands.      |
| <sub>optional</sub> | `--version` | boolean | undefined | Show version number. Cannot be used with other parameters or sub-commands. |

### `xunnctl config`

> Alias: `x c`

This command, unless called with `--help`, is an alias for
[`xunnctl config get --all`][3].

##### Examples

```bash
xunnctl config
x c
```

##### Parameters

See [`xunnctl config get`][3].

### `xunnctl config get`

> Alias: `x c g`

This command outputs the value of one or more `xunnctl` configuration options.
These values are stored [locally][1] and protected with `0600` permissions.

##### Examples

```bash
xunnctl config get --name cloudflare.apiToken
x c g --name cloudflare.apiToken cloudflare.accountId
x c g --name cloudflare.apiToken --name cloudflare.accountId
# The next two lines are equivalent
x c g --all
x c g
```

##### Parameters

|                     |      Name       |   Type    |           Default           | Description                                                                                      |
| :-----------------: | :-------------: | :-------: | :-------------------------: | :----------------------------------------------------------------------------------------------- |
| <sub>optional</sub> |     `--all`     |  boolean  |          undefined          | Dump the current value of all configuration options. Cannot be used with the `--name` parameter. |
| <sub>optional</sub> | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                        |
| <sub>optional</sub> |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.   |
| <sub>optional</sub> |    `--name`     | string\[] |          undefined          | The names of one or more options to retrieve. Cannot be used with the `--all` parameter.         |

### `xunnctl config set`

> Alias: `x c s`

This command updates the value of the `--name` configuration option to
`--content`. This value is stored [locally][1] and protected with `0600`
permissions.

##### Examples

```bash
xunnctl config set --name cloudflare.apiToken --content AbCd1234
x c s --name cloudflare.apiToken --content AbCd1234
```

##### Parameters

|                         |      Name       |                     Type                     |           Default           | Description                                                                                                      |
| :---------------------: | :-------------: | :------------------------------------------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** |   `--content`   | string <sub>(unescaped spaces allowed)</sub> |          undefined          | The new value of the option to update. <sub>(unescaped spaces allowed)</sub>                                     |
| **<sub>REQUIRED</sub>** |    `--name`     |                    string                    |          undefined          | The name of the option to update.                                                                                |
|   <sub>optional</sub>   | `--config-path` |                    string                    | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|   <sub>optional</sub>   |    `--help`     |                   boolean                    |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|   <sub>optional</sub>   |    `--quiet`    |                    count                     |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns record`

> Alias: `x d r`

This command, unless called with `--help`, is an alias for
[`xunnctl dns record retrieve --apex-api`][4].

##### Examples

```bash
xunnctl dns record
x d r
```

##### Parameters

See [`xunnctl dns record retrieve`][4].

### `xunnctl dns record create A`

> Alias: `x d r c a`

This command creates a new DNS A resource record in one or more existing zones.

##### Examples

```bash
xunnctl dns record create a --apex xunn.io --name @ --ipv4 1.2.3.4 --proxied=false
x d r c A --apex xunn.io --name 'something.else' --ipv4 1.2.3.4
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|        **<sub>REQUIRED</sub>**         |    `--ipv4`     |  string   |          undefined          | A valid IPv4 address.                                                                                            |
|        **<sub>REQUIRED</sub>**         |    `--name`     |  string   |          undefined          | DNS record name (or @ for the zone apex) in Punycode.                                                            |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |   `--proxied`   |  boolean  |            false            | Whether the record is receiving the performance and security benefits of Cloudflare.                             |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns record create AAAA`

> Alias: `x d r c aaaa`

This command creates a new DNS AAAA resource record in one or more existing
zones.

##### Examples

```bash
xunnctl dns record create aaaa --apex xunn.io --name @ --ipv6 ::ffff:1.2.3.4 --proxied=false
x d r c AAAA --apex xunn.io --name 'something.else' --ipv6 2001:db8::8a2e:7334
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|        **<sub>REQUIRED</sub>**         |    `--ipv6`     |  string   |          undefined          | A valid IPv6 address.                                                                                            |
|        **<sub>REQUIRED</sub>**         |    `--name`     |  string   |          undefined          | DNS record name (or @ for the zone apex) in Punycode.                                                            |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |   `--proxied`   |  boolean  |            false            | Whether the record is receiving the performance and security benefits of Cloudflare.                             |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns record create CAA`

> Alias: `x d r c caa`

This command creates pre-configured "issue" and "iodef" CAA resource records in
one or more existing zones.

##### Examples

```bash
xunnctl dns record create caa --apex xunn.io
x d r c CAA --apex xunn.io --apex xunn.at
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns record create CNAME`

> Alias: `x d r c cname`

This command creates a new DNS CNAME resource record in one or more existing
zones.

##### Examples

```bash
xunnctl dns record create cname --apex xunn.io --name 'sub.domain' --to-name 'diff.com'
x d r c CNAME --apex xunn.io --apex xunn.at --name 'sub.domain' --to-name 'diff.com'
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|        **<sub>REQUIRED</sub>**         |    `--name`     |  string   |          undefined          | DNS record name (or @ for the zone apex) in Punycode.                                                            |
|        **<sub>REQUIRED</sub>**         |   `--to-name`   |  string   |          undefined          | A valid hostname. Must not match the record's name.                                                              |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |   `--proxied`   |  boolean  |            false            | Whether the record is receiving the performance and security benefits of Cloudflare.                             |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns record create MX`

> Alias: `x d r c mx`

This command creates a new DNS MX resource record in one or more existing zones.

##### Examples

```bash
xunnctl dns record create mx --apex xunn.io --name '@' --mail-name 'mail.xunn.io'
x d r c MX --apex xunn.io --apex xunn.at --name 'something.else' --mail-name 'mail.xunn.io'
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|        **<sub>REQUIRED</sub>**         |    `--name`     |  string   |          undefined          | DNS record name (or @ for the zone apex) in Punycode.                                                            |
|        **<sub>REQUIRED</sub>**         |  `--mail-name`  |  string   |          undefined          | A valid mail server hostname.                                                                                    |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns record create TXT`

> Alias: `x d r c txt`

This command creates a new DNS TXT resource record in one or more existing
zones.

##### Examples

```bash
xunnctl dns record create txt --apex xunn.io --name @ --content '...'
x d r c TXT --apex xunn.io --apex xunn.at --name 'something.else' --content '...'
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|        **<sub>REQUIRED</sub>**         |    `--name`     |  string   |          undefined          | DNS record name (or @ for the zone apex) in Punycode.                                                            |
|        **<sub>REQUIRED</sub>**         |   `--content`   |  string   |          undefined          | Text content for the record.                                                                                     |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns record retrieve`

> Alias: `x d r r`

This command retrieves the resource record `--name` of type `--type` from the
`--apex` DNS zone.

The result can be queried via `--query`, which accepts a [JMESPath][5] value.
Note that, as a feature, the presence of spaces in the query does not
necessitate quoting or escaping (e.g. `--query { id: id }` and
`--query '{ id: id }'` are identical).

##### Examples

```bash
xunnctl dns record retrieve --apex xunn.io --name mail --type CNAME
x d r r --apex-api --apex new-site.com --name mail --type cname
x d r r --apex xunn.io --apex xunn.at --name mail --type cname --query id
```

##### Parameters

|                                        |      Name       |                     Type                     |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :------------------------------------------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     |                  string\[]                   |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |                   boolean                    |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |                    string                    |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|        **<sub>REQUIRED</sub>**         |    `--name`     |                    string                    |          undefined          | DNS record name (or @ for the zone apex) in Punycode.                                                            |
|        **<sub>REQUIRED</sub>**         |    `--type`     |                    string                    |          undefined          | Text content for the record.                                                                                     |
|          <sub>optional</sub>           | `--config-path` |                    string                    | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |                   boolean                    |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |    `--query`    | string <sub>(unescaped spaces allowed)</sub> |          undefined          | A [JMESPath][5] query string. Unescaped spaces are preserved in CLI.                                             |
|          <sub>optional</sub>           |    `--quiet`    |                    count                     |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns zone`

> Alias: `x d z`

This command, unless called with `--help`, is an alias for
[`xunnctl dns zone retrieve --apex-api`][6].

##### Examples

```bash
xunnctl dns zone
x d z
```

##### Parameters

See [`xunnctl dns zone retrieve`][6].

### `xunnctl dns zone create`

> Alias: `x d z c`

This command creates and initializes a new DNS `--apex` zone. If a conflicting
apex zone already exists, this command will fail. If you're trying to bring an
existing zone up to current configuration standards, see
[`xunnctl dns zone update`][7] instead.

##### Examples

```bash
xunnctl dns zone create --apex xunn.at
x d z c --apex xunn.at
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns zone retrieve`

> Alias: `x d z r`

This command returns information about one or more `--apex` zones.

The result can be queried via `--query`, which accepts a [JMESPath][5] value.
Note that, as a feature, the presence of spaces in the query does not
necessitate quoting or escaping (e.g. `--query { id: id }` and
`--query '{ id: id }'` are identical).

##### Examples

```bash
xunnctl dns zone retrieve --apex xunn.at
x d z r --apex-api --apex new-site.com --query id
x d z r --apex xunn.io --apex xunn.at --query { id: id, cdnOnly: meta.cdn_only }
```

##### Parameters

|                                        |      Name       |                     Type                     |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :------------------------------------------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     |                  string\[]                   |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |                   boolean                    |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |                    string                    |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|          <sub>optional</sub>           | `--config-path` |                    string                    | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |                   boolean                    |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |    `--query`    | string <sub>(unescaped spaces allowed)</sub> |          undefined          | A [JMESPath][5] query string. Unescaped spaces are preserved in CLI.                                             |
|          <sub>optional</sub>           |    `--quiet`    |                    count                     |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl dns zone update`

> Alias: `x d z u`

This command is equivalent to [`xunnctl dns zone create`][8] but for zones that
already exist. It will attempt to bring one or more zones up to date with the
latest best practices with respect to zone configuration; any failures thrown
when attempting to create records, while reported, are ignored.

##### Examples

```bash
xunnctl dns zone update --apex-api
x d z u --apex-file /file/containing/domain/names.txt
x d z u --apex xunn.at
```

##### Parameters

|                                        |      Name       |   Type    |           Default           | Description                                                                                                      |
| :------------------------------------: | :-------------: | :-------: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED <sup>1/3</sup></sub>** |    `--apex`     | string\[] |          undefined          | Zero or more zone apex domains.                                                                                  |
| **<sub>REQUIRED <sup>2/3</sup></sub>** |  `--apex-api`   |  boolean  |          undefined          | Include all known domains zone apex domains.                                                                     |
| **<sub>REQUIRED <sup>3/3</sup></sub>** |  `--apex-file`  |  string   |          undefined          | A path to a newline-delimited file containing zero or more zone apex domains.                                    |
|          <sub>optional</sub>           | `--config-path` |  string   | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|          <sub>optional</sub>           |    `--help`     |  boolean  |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|          <sub>optional</sub>           |    `--quiet`    |   count   |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl firewall`

> Alias: `x f`

This command, unless called with `--help`, is an alias for
[`xunnctl firewall status`][9].

##### Examples

```bash
xunnctl firewall
x f
```

##### Parameters

See [`xunnctl firewall status`][9].

### `xunnctl firewall ban`

> Alias: `x f b`

This command adds an ip address to the global hostile ip list, which is a
[Cloudflare WAF List][10]. No managed system will accept packets coming from an
IP on this list. Both ipv4 and ipv6 addresses are supported, as is CIDR
notation.

##### Examples

```bash
xunnctl firewall ban --ip 1.2.3.4
x f b --ip 1.2.3.4
```

##### Parameters

|                         |      Name       |  Type   |           Default           | Description                                                                                                      |
| :---------------------: | :-------------: | :-----: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** |     `--ip`      | string  |          undefined          | The IP address to ban. Both ipv4 and ipv6 are supported.                                                         |
|   <sub>optional</sub>   | `--config-path` | string  | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|   <sub>optional</sub>   |    `--help`     | boolean |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|   <sub>optional</sub>   |    `--quiet`    |  count  |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl firewall status`

> Alias: `x f s`

This command returns the contents of the global hostile ip list, which is a
[Cloudflare WAF List][10]. No managed system will accept packets coming from an
IP on this list.

##### Examples

```bash
xunnctl firewall status
x f s
```

##### Parameters

|                     |      Name       |  Type   |           Default           | Description                                                                                                      |
| :-----------------: | :-------------: | :-----: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| <sub>optional</sub> | `--config-path` | string  | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
| <sub>optional</sub> |    `--help`     | boolean |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
| <sub>optional</sub> |    `--quiet`    |  count  |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl firewall unban`

> Alias: `x f u`

This command removes an ip address from the global hostile ip list, which is a
[Cloudflare WAF List][10]. No managed system will accept packets coming from an
IP on this list.

##### Examples

```bash
xunnctl firewall unban --ip 1.2.3.4
x f u --ip 1.2.3.4
```

##### Parameters

|                         |      Name       |  Type   |           Default           | Description                                                                                                      |
| :---------------------: | :-------------: | :-----: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** |     `--ip`      | string  |          undefined          | The IP address to ban. Both ipv4 and ipv6 are supported.                                                         |
|   <sub>optional</sub>   | `--config-path` | string  | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|   <sub>optional</sub>   |    `--help`     | boolean |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|   <sub>optional</sub>   |    `--quiet`    |  count  |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

### `xunnctl raw`

> Alias: `x r`

This command will dump freeform data into stdout conditioned on the value of
`--id`.

The following values for `--id` are supported:

- `conf.nginx.allowOnlyCloudflare` - An nginx configuration file consisting of
  directives that, when included in an server context, will cause nginx to
  reject all connection attempts from IP addresses that do not belong to
  Cloudflare.

##### Examples

```bash
xunnctl raw --id conf.nginx.allowOnlyCloudflare
x r --id conf.nginx.allowOnlyCloudflare
```

##### Parameters

|                         |      Name       |  Type   |           Default           | Description                                                                                                      |
| :---------------------: | :-------------: | :-----: | :-------------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **<sub>REQUIRED</sub>** |     `--id`      | string  |          undefined          | The identifier associated with the target data.                                                                  |
|   <sub>optional</sub>   | `--config-path` | string  | OS-dependent (XDG on linux) | Path to the `xunnctl` configuration file.                                                                        |
|   <sub>optional</sub>   |    `--help`     | boolean |          undefined          | Show help text specific to this command. Cannot be used with other parameters or sub-commands.                   |
|   <sub>optional</sub>   |    `--quiet`    |  count  |              0              | The amount of output generated is inversely proportional to the number of times this parameter appears (max: 2). |

## Appendix

Further documentation can be found under [`docs/`][x-repo-docs].

### Published Package Details

This is a [CJS2 package][x-pkg-cjs-mojito] with statically-analyzable exports
built by Babel for Node.js versions that are not end-of-life.

<details><summary>Expand details</summary>

That means both CJS2 (via `require(...)`) and ESM (via `import { ... } from ...`
or `await import(...)`) source will load this package from the same entry points
when using Node. This has several benefits, the foremost being: less code
shipped/smaller package size, avoiding [dual package
hazard][x-pkg-dual-package-hazard] entirely, distributables are not
packed/bundled/uglified, and a less complex build process.

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
optimal [tree shaking][x-pkg-tree-shaking].

</details>

### License

See [LICENSE][x-repo-license].

## Contributing and Support

**[New issues][x-repo-choose-new-issue] and [pull requests][x-repo-pr-compare]
are always welcome and greatly appreciated! 🤩** Just as well, you can [star 🌟
this project][x-badge-repo-link] to let me know you found it useful! ✊🏿 Thank
you!

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
  https://img.shields.io/npm/dm/xunnctl?style=flat-square
  'Number of times this package has been downloaded per month'
[x-badge-lastcommit-image]:
  https://img.shields.io/github/last-commit/xunnamius/xunnctl?style=flat-square
  'Latest commit timestamp'
[x-badge-license-image]:
  https://img.shields.io/npm/l/xunnctl?style=flat-square
  "This package's source license"
[x-badge-license-link]: https://github.com/Xunnamius/xunnctl/blob/main/LICENSE
[x-badge-npm-image]:
  https://xunn.at/npm-pkg-version/xunnctl
  'Install this package using npm or yarn!'
[x-badge-npm-link]: https://www.npmjs.com/package/xunnctl
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
[x-repo-support]: /.github/SUPPORT.md
[1]: https://github.com/sindresorhus/env-paths
[2]: #xunnctl-config-set
[3]: #xunnctl-config-get
[4]: #xunnctl-dns-record-retrieve
[5]: https://jmespath.org/tutorial.html
[6]: #xunnctl-dns-zone-retrieve
[7]: #xunnctl-dns-zone-update
[8]: #xunnctl-dns-zone-create
[9]: #xunnctl-firewall-status
[10]: https://developers.cloudflare.com/waf/tools/lists
