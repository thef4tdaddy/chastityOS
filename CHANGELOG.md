# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.7.1-nightly.1](https://github.com/thef4tdaddy/chastityOS/compare/v3.7.1-nightly.0...v3.7.1-nightly.1) (2025-06-14)


### 🐛 Bug Fixes

* minor bug preventing vercel build ([5e30f83](https://github.com/thef4tdaddy/chastityOS/commit/5e30f832b934129f532e88f777152345fa82ed0f))

### [3.7.1-nightly.0](https://github.com/thef4tdaddy/chastityOS/compare/v3.7.0...v3.7.1-nightly.0) (2025-06-13)


### 🧹 Chores

* separate nightly/prod visuals, fix reset all, and adjust UI styling ([a3bb20d](https://github.com/thef4tdaddy/chastityOS/commit/a3bb20d3d599ca013e00dea941d7273424bae975))

## 3.7.0 – Finalized Split Between Nightly and Production

- Separated environments with distinct Firebase configs, themes, and build logic
- Header, feedback, and release tags now context-aware (nightly vs production)
- Settings split into:
  - **Profile & Preferences**
  - **Data Management**
- Added error logging and environment display to console
- General bug fixes and build stabilization
