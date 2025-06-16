# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.7.1](https://github.com/thef4tdaddy/chastityOS/compare/v3.7.0...v3.7.1) (2025-06-16)


### 🐛 Bug Fixes

* discord release github action ([8961aff](https://github.com/thef4tdaddy/chastityOS/commit/8961aff3e2e812611533f9891d04112b91308d3f))
* vite.config.js fix ([1b8baa8](https://github.com/thef4tdaddy/chastityOS/commit/1b8baa806e3ac1df15b7ff7d815922a0dac84426))

## 3.7.0 – Finalized Split Between Nightly and Production

- Separated environments with distinct Firebase configs, themes, and build logic
- Header, feedback, and release tags now context-aware (nightly vs production)
- Settings split into:
  - **Profile & Preferences**
  - **Data Management**
- Added error logging and environment display to console
- General bug fixes and build stabilization
