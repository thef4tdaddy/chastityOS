# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.9.0-nightly.0](https://github.com/thef4tdaddy/chastityOS/compare/v3.8.2-nightly.0...v3.9.0-nightly.0) (2025-06-17)


### ✨ Features

* cleaning up css, adding self locking, scaffolding out tasks but not implemented ([456b5d3](https://github.com/thef4tdaddy/chastityOS/commit/456b5d3c211b43837fba7fe574f3ccb3bc0ca855))


### 📚 Documentation

* scripts being put to git ([66f5e63](https://github.com/thef4tdaddy/chastityOS/commit/66f5e6364ee25bba40687041b2cdc8ad523497bd))

### [3.8.2-nightly.0](https://github.com/thef4tdaddy/chastityOS/compare/v3.8.0-nightly.3...v3.8.2-nightly.0) (2025-06-16)

## [3.8.0-nightly.3](https://github.com/thef4tdaddy/chastityOS/compare/v3.8.0-nightly.2...v3.8.0-nightly.3) (2025-06-15)


### 🐛 Bug Fixes

* build issue when seperating variants ([fd3f858](https://github.com/thef4tdaddy/chastityOS/commit/fd3f858e576a910efd90ab0ac0f3c5760328baa7))
* discord release github action ([499acf1](https://github.com/thef4tdaddy/chastityOS/commit/499acf1f7b95a3012e7c1a45aba28d2b39e39871))

## [3.8.0-nightly.2](https://github.com/thef4tdaddy/chastityOS/compare/v3.8.0-nightly.1...v3.8.0-nightly.2) (2025-06-14)


### 🐛 Bug Fixes

* tailwind config fix attempt 2 ([4919dfe](https://github.com/thef4tdaddy/chastityOS/commit/4919dfe3cc2c70d0f4ad0357b2584ef7146f3734))

## [3.8.0-nightly.1](https://github.com/thef4tdaddy/chastityOS/compare/v3.8.0-nightly.0...v3.8.0-nightly.1) (2025-06-14)


### 🐛 Bug Fixes

* deleting tailwing config found ([e288f57](https://github.com/thef4tdaddy/chastityOS/commit/e288f579dac5198204d6a4db2cb5e566c755a740))

## [3.8.0-nightly.0](https://github.com/thef4tdaddy/chastityOS/compare/v3.7.0...v3.8.0-nightly.0) (2025-06-14)


### ✨ Features

* color seperation of nightly / prod and specific colorings of boxes (in progress) ([8548104](https://github.com/thef4tdaddy/chastityOS/commit/8548104577bf609d1984016f4e9d06352e0c060b))

## 3.7.0 – Finalized Split Between Nightly and Production

- Separated environments with distinct Firebase configs, themes, and build logic
- Header, feedback, and release tags now context-aware (nightly vs production)
- Settings split into:
  - **Profile & Preferences**
  - **Data Management**
- Added error logging and environment display to console
- General bug fixes and build stabilization
