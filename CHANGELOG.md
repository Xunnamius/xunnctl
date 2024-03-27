# Changelog

All notable changes to this project will be documented in this auto-generated
file. The format is based on [Conventional Commits][1];
this project adheres to [Semantic Versioning][2].

### [1.3.6][3] (2024-03-27)

#### 🪄 Fixes

- **src:** respond properly to --hush et al ([d33e23e][4])

### [1.3.5][5] (2024-03-27)

#### 🪄 Fixes

- Demystify name-based parameters and improve documentation ([b2606e9][6])

### [1.3.4][7] (2024-03-27)

#### ⚙️ Build System

- **package:** update [@black-][8]flag/core to 1.2.4 ([139f1db][9])

### [1.3.3][10] (2024-03-27)

#### ⚙️ Build System

- Add per-command "command" export ([48647c2][11])

### [1.3.2][12] (2024-03-27)

#### ⚙️ Build System

- Add "commands/\*" and "configure" exports ([956aede][13])

### [1.3.1][14] (2024-03-26)

#### 🪄 Fixes

- **src:** do not output success messages if quieted ([73a03e0][15])

## [1.3.0][16] (2024-03-26)

#### ✨ Features

- Add support for simultaneous access to DO and CF apis ([8d13834][17])

## [1.2.0][18] (2024-03-25)

#### ✨ Features

- **src:** add ttl option ([a744584][19])

## [1.1.0][20] (2024-03-25)

#### ✨ Features

- **src:** remove unnecessary ACME CNAME records, add --search-for-name options ([2a2fcdf][21])

#### 🪄 Fixes

- **package:** bump minimum node support to 20 LTS ([855c244][22])

### [1.0.1][23] (2024-03-24)

#### ⚙️ Build System

- Cross-project badge link update ([7275721][24])

## [1.0.0][25] (2024-03-24)

#### ✨ Features

- Add cli entry point and tests ([336a8cf][26])
- **lib:** add tag functionality to rejoinder; fix several small bugs across output libs ([957b68c][27])
- **lib:** drop in shared libs ([1741368][28])
- **lib:** implement dynamic options, dynamic strictness ([d2ade6f][29])
- **src:** implement "x d r" and add struts for "x d r r" \[WIP] ([4d1ddcc][30])
- **src:** implement "x d z" and "x d z r" ([4ba697d][31])

#### 🪄 Fixes

- **src:** ensure default action of "x c" is "x c g" ([1ce0667][32])
- **src:** ensure output state is propagated properly ([33c04a6][33])
- **src:** react properly to --silent, --quiet, and --hush ([2a75447][34])

#### ⚙️ Build System

- **babel:** fix import specifier rewrite oversight ([0bde6bb][35])
- **husky:** update to latest hooks ([55820a6][36])

[1]: https://conventionalcommits.org
[2]: https://semver.org
[3]: https://github.com/Xunnamius/xunnctl/compare/v1.3.5...v1.3.6
[4]: https://github.com/Xunnamius/xunnctl/commit/d33e23e1d6c659b3ba71ec93c3f4784e6a94ba47
[5]: https://github.com/Xunnamius/xunnctl/compare/v1.3.4...v1.3.5
[6]: https://github.com/Xunnamius/xunnctl/commit/b2606e9808f7f8f1b87efdcc8d5ee7edb905d06f
[7]: https://github.com/Xunnamius/xunnctl/compare/v1.3.3...v1.3.4
[8]: https://github.com/black-
[9]: https://github.com/Xunnamius/xunnctl/commit/139f1db135ea31782f9810c8476ce3a52832947f
[10]: https://github.com/Xunnamius/xunnctl/compare/v1.3.2...v1.3.3
[11]: https://github.com/Xunnamius/xunnctl/commit/48647c253e3b6babc1b69f501af99a73a58542bd
[12]: https://github.com/Xunnamius/xunnctl/compare/v1.3.1...v1.3.2
[13]: https://github.com/Xunnamius/xunnctl/commit/956aede83e0bf9b08b6f0fd5e09b1cc68fa45030
[14]: https://github.com/Xunnamius/xunnctl/compare/v1.3.0...v1.3.1
[15]: https://github.com/Xunnamius/xunnctl/commit/73a03e0f9551455216950b90425a47b95788681a
[16]: https://github.com/Xunnamius/xunnctl/compare/v1.2.0...v1.3.0
[17]: https://github.com/Xunnamius/xunnctl/commit/8d13834e72889aaaf3935e861a3c326b306e1e8b
[18]: https://github.com/Xunnamius/xunnctl/compare/v1.1.0...v1.2.0
[19]: https://github.com/Xunnamius/xunnctl/commit/a7445847ee35170b0345d17ff5c28d8e13bfe3f5
[20]: https://github.com/Xunnamius/xunnctl/compare/v1.0.1...v1.1.0
[21]: https://github.com/Xunnamius/xunnctl/commit/2a2fcdfb26b0e5bc21c5d607bdb5f09eb12031e4
[22]: https://github.com/Xunnamius/xunnctl/commit/855c2445b1f4c39895937e849e372aec5ad1416a
[23]: https://github.com/Xunnamius/xunnctl/compare/v1.0.0...v1.0.1
[24]: https://github.com/Xunnamius/xunnctl/commit/7275721d2c76c3580bd7474c367cddf9f6fb2b76
[25]: https://github.com/Xunnamius/xunnctl/compare/1741368d12017a3366d8f4f84ad3a97d8814f892...v1.0.0
[26]: https://github.com/Xunnamius/xunnctl/commit/336a8cf9914bcf207b8530c3597c9a0c97ba2e6c
[27]: https://github.com/Xunnamius/xunnctl/commit/957b68c756a696f3c5856508ca1d9791c77e6e96
[28]: https://github.com/Xunnamius/xunnctl/commit/1741368d12017a3366d8f4f84ad3a97d8814f892
[29]: https://github.com/Xunnamius/xunnctl/commit/d2ade6fd093589b4add43c453e2ccd2d996ba264
[30]: https://github.com/Xunnamius/xunnctl/commit/4d1ddcc73f0c9932daec7a7ad8df92ede50770b2
[31]: https://github.com/Xunnamius/xunnctl/commit/4ba697d417cb97f097f29722bee10564a2e28679
[32]: https://github.com/Xunnamius/xunnctl/commit/1ce06679cd485cbe6bba55151f6b3abbe290047f
[33]: https://github.com/Xunnamius/xunnctl/commit/33c04a62a26f088395322f460e0139338ad5eb0e
[34]: https://github.com/Xunnamius/xunnctl/commit/2a754470b266a5b09fa0d0d2b426d51f2e34a831
[35]: https://github.com/Xunnamius/xunnctl/commit/0bde6bb01025b7eb4ffa2e65c99da53158ffb166
[36]: https://github.com/Xunnamius/xunnctl/commit/55820a6b9f3699c53b5f2bd972f4d86a7efa951d
