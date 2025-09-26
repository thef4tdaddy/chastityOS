# 🔢 Versioning Strategy – ChastityOS

This document outlines the versioning workflow and branching strategy for ChastityOS.

---

## 🧭 Branching Model

- `nightly`: Active development branch for in-progress features, fixes, or experiments.
- `main`: Stable production branch used for public releases.

---

## 📈 Version Format

ChastityOS uses [Semantic Versioning](https://semver.org/):  
`MAJOR.MINOR.PATCH` (e.g., `4.1.2`)

| Type    | Description                                   |
| ------- | --------------------------------------------- |
| `MAJOR` | Breaking changes                              |
| `MINOR` | New features that are backward-compatible     |
| `PATCH` | Bug fixes and small changes (no new features) |

---

## 🚀 Release Flow

### 🔁 Nightly Development

- Use the task: **Release • Nightly Pre-release**
- Bumps versions like `3.6.3-nightly.0`, `3.6.3-nightly.1`
- Used for development and testing snapshots

### 🔁 After Merging to `main`

| Situation          | Task Name                            | Version Result  |
| ------------------ | ------------------------------------ | --------------- |
| New features added | Release • Stable After Merge (minor) | `3.6.0 → 3.7.0` |
| Breaking changes   | Release • Stable After Merge (major) | `3.7.0 → 4.0.0` |

### 🩹 Direct Patch Fixes on Main

- Use the task: **Release • Patch on Main (direct fix)**
- For hotfixes that don’t need to go through `nightly`
- Bumps versions like `3.6.2 → 3.6.3`

---

## 🛠 Tools Used

- [`standard-version`](https://github.com/conventional-changelog/standard-version) for versioning and changelog management
- GitHub Actions for creating releases on version tag push (`vX.Y.0`)
- VSCode Task Runner for simplified command execution

---

## ✅ Commit Convention

ChastityOS uses [Conventional Commits](docs/CONVENTIONAL_COMMITS.md) to automate changelogs and versioning.

### Examples

```
feat: add keyholder rewards page
fix: correct session timer rounding
chore: update eslint config
```

Each type maps to a semantic version bump:

- `feat:` → Minor
- `fix:` → Patch
- `chore:`, `docs:`, `style:` → No version bump (unless configured)

---
