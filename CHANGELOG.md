# Changelog

All notable changes to this project will be documented in this auto-generated
file. The format is based on [Conventional Commits][1];
this project adheres to [Semantic Versioning][2].

## [1.1.0][3] (2024-03-25)

#### ✨ Features

- **src:** remove unnecessary ACME CNAME records, add --search-for-name options ([2a2fcdf][4])

#### 🪄 Fixes

- **package:** bump minimum node support to 20 LTS ([855c244][5])

### [1.0.1][6] (2024-03-24)

#### ⚙️ Build System

- Cross-project badge link update ([7275721][7])

## [1.0.0][8] (2024-03-24)

#### ✨ Features

- Add cli entry point and tests ([336a8cf][9])
- **lib:** add tag functionality to rejoinder; fix several small bugs across output libs ([957b68c][10])
- **lib:** drop in shared libs ([1741368][11])
- **lib:** implement dynamic options, dynamic strictness ([d2ade6f][12])
- **src:** implement "x d r" and add struts for "x d r r" \[WIP] ([4d1ddcc][13])
- **src:** implement "x d z" and "x d z r" ([4ba697d][14])

#### 🪄 Fixes

- **src:** ensure default action of "x c" is "x c g" ([1ce0667][15])
- **src:** ensure output state is propagated properly ([33c04a6][16])
- **src:** react properly to --silent, --quiet, and --hush ([2a75447][17])

#### ⚙️ Build System

- **babel:** fix import specifier rewrite oversight ([0bde6bb][18])
- **husky:** update to latest hooks ([55820a6][19])

[1]: https://conventionalcommits.org
[2]: https://semver.org
[3]: https://github.com/Xunnamius/xunnctl/compare/v1.0.1...v1.1.0
[4]: https://github.com/Xunnamius/xunnctl/commit/2a2fcdfb26b0e5bc21c5d607bdb5f09eb12031e4
[5]: https://github.com/Xunnamius/xunnctl/commit/855c2445b1f4c39895937e849e372aec5ad1416a
[6]: https://github.com/Xunnamius/xunnctl/compare/v1.0.0...v1.0.1
[7]: https://github.com/Xunnamius/xunnctl/commit/7275721d2c76c3580bd7474c367cddf9f6fb2b76
[8]: https://github.com/Xunnamius/xunnctl/compare/1741368d12017a3366d8f4f84ad3a97d8814f892...v1.0.0
[9]: https://github.com/Xunnamius/xunnctl/commit/336a8cf9914bcf207b8530c3597c9a0c97ba2e6c
[10]: https://github.com/Xunnamius/xunnctl/commit/957b68c756a696f3c5856508ca1d9791c77e6e96
[11]: https://github.com/Xunnamius/xunnctl/commit/1741368d12017a3366d8f4f84ad3a97d8814f892
[12]: https://github.com/Xunnamius/xunnctl/commit/d2ade6fd093589b4add43c453e2ccd2d996ba264
[13]: https://github.com/Xunnamius/xunnctl/commit/4d1ddcc73f0c9932daec7a7ad8df92ede50770b2
[14]: https://github.com/Xunnamius/xunnctl/commit/4ba697d417cb97f097f29722bee10564a2e28679
[15]: https://github.com/Xunnamius/xunnctl/commit/1ce06679cd485cbe6bba55151f6b3abbe290047f
[16]: https://github.com/Xunnamius/xunnctl/commit/33c04a62a26f088395322f460e0139338ad5eb0e
[17]: https://github.com/Xunnamius/xunnctl/commit/2a754470b266a5b09fa0d0d2b426d51f2e34a831
[18]: https://github.com/Xunnamius/xunnctl/commit/0bde6bb01025b7eb4ffa2e65c99da53158ffb166
[19]: https://github.com/Xunnamius/xunnctl/commit/55820a6b9f3699c53b5f2bd972f4d86a7efa951d
