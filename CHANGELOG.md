# Changelog

All notable changes to this project will be documented in this auto-generated
file. The format is based on [Conventional Commits][1];
this project adheres to [Semantic Versioning][2].

## [1.3.0][3] (2024-03-26)

#### ✨ Features

- Add support for simultaneous access to DO and CF apis ([8d13834][4])

## [1.2.0][5] (2024-03-25)

#### ✨ Features

- **src:** add ttl option ([a744584][6])

## [1.1.0][7] (2024-03-25)

#### ✨ Features

- **src:** remove unnecessary ACME CNAME records, add --search-for-name options ([2a2fcdf][8])

#### 🪄 Fixes

- **package:** bump minimum node support to 20 LTS ([855c244][9])

### [1.0.1][10] (2024-03-24)

#### ⚙️ Build System

- Cross-project badge link update ([7275721][11])

## [1.0.0][12] (2024-03-24)

#### ✨ Features

- Add cli entry point and tests ([336a8cf][13])
- **lib:** add tag functionality to rejoinder; fix several small bugs across output libs ([957b68c][14])
- **lib:** drop in shared libs ([1741368][15])
- **lib:** implement dynamic options, dynamic strictness ([d2ade6f][16])
- **src:** implement "x d r" and add struts for "x d r r" \[WIP] ([4d1ddcc][17])
- **src:** implement "x d z" and "x d z r" ([4ba697d][18])

#### 🪄 Fixes

- **src:** ensure default action of "x c" is "x c g" ([1ce0667][19])
- **src:** ensure output state is propagated properly ([33c04a6][20])
- **src:** react properly to --silent, --quiet, and --hush ([2a75447][21])

#### ⚙️ Build System

- **babel:** fix import specifier rewrite oversight ([0bde6bb][22])
- **husky:** update to latest hooks ([55820a6][23])

[1]: https://conventionalcommits.org
[2]: https://semver.org
[3]: https://github.com/Xunnamius/xunnctl/compare/v1.2.0...v1.3.0
[4]: https://github.com/Xunnamius/xunnctl/commit/8d13834e72889aaaf3935e861a3c326b306e1e8b
[5]: https://github.com/Xunnamius/xunnctl/compare/v1.1.0...v1.2.0
[6]: https://github.com/Xunnamius/xunnctl/commit/a7445847ee35170b0345d17ff5c28d8e13bfe3f5
[7]: https://github.com/Xunnamius/xunnctl/compare/v1.0.1...v1.1.0
[8]: https://github.com/Xunnamius/xunnctl/commit/2a2fcdfb26b0e5bc21c5d607bdb5f09eb12031e4
[9]: https://github.com/Xunnamius/xunnctl/commit/855c2445b1f4c39895937e849e372aec5ad1416a
[10]: https://github.com/Xunnamius/xunnctl/compare/v1.0.0...v1.0.1
[11]: https://github.com/Xunnamius/xunnctl/commit/7275721d2c76c3580bd7474c367cddf9f6fb2b76
[12]: https://github.com/Xunnamius/xunnctl/compare/1741368d12017a3366d8f4f84ad3a97d8814f892...v1.0.0
[13]: https://github.com/Xunnamius/xunnctl/commit/336a8cf9914bcf207b8530c3597c9a0c97ba2e6c
[14]: https://github.com/Xunnamius/xunnctl/commit/957b68c756a696f3c5856508ca1d9791c77e6e96
[15]: https://github.com/Xunnamius/xunnctl/commit/1741368d12017a3366d8f4f84ad3a97d8814f892
[16]: https://github.com/Xunnamius/xunnctl/commit/d2ade6fd093589b4add43c453e2ccd2d996ba264
[17]: https://github.com/Xunnamius/xunnctl/commit/4d1ddcc73f0c9932daec7a7ad8df92ede50770b2
[18]: https://github.com/Xunnamius/xunnctl/commit/4ba697d417cb97f097f29722bee10564a2e28679
[19]: https://github.com/Xunnamius/xunnctl/commit/1ce06679cd485cbe6bba55151f6b3abbe290047f
[20]: https://github.com/Xunnamius/xunnctl/commit/33c04a62a26f088395322f460e0139338ad5eb0e
[21]: https://github.com/Xunnamius/xunnctl/commit/2a754470b266a5b09fa0d0d2b426d51f2e34a831
[22]: https://github.com/Xunnamius/xunnctl/commit/0bde6bb01025b7eb4ffa2e65c99da53158ffb166
[23]: https://github.com/Xunnamius/xunnctl/commit/55820a6b9f3699c53b5f2bd972f4d86a7efa951d
