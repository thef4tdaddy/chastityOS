# 🧾 Conventional Commits Cheat Sheet

Conventional Commits define a standard way to structure commit messages, enabling automated changelogs, version bumps, and clearer history.

---

## ✅ Basic Format

```
<type>(optional scope): <short summary>

<optional longer description>
```

Example:

```
feat(keyholder): add punishment system

Includes duration setting, reward/punishment toggle, and inline edits.
```

---

## 🎯 Common Types

| Type        | Example                                | Description                              | Affects Version | Changelog Section           |
|-------------|----------------------------------------|------------------------------------------|------------------|------------------------------|
| `feat`      | `feat: add reward toggle`              | A new feature                            | Minor bump       | ✨ Features                  |
| `fix`       | `fix: correct timer bug`               | A bug fix                                | Patch bump       | 🐛 Bug Fixes                |
| `chore`     | `chore: setup husky hooks`             | Build process, tooling, infra            | No bump          | 🧹 Chores (if enabled)       |
| `docs`      | `docs: update changelog`               | Documentation only                       | No bump          | 📚 Documentation (if enabled)|
| `refactor`  | `refactor: streamline settings flow`   | Code change with no new feature or fix   | No bump          | 🔧 Refactoring (if enabled)  |
| `style`     | `style: fix spacing`                   | Formatting only (no code changes)        | No bump          | *(optional)*                |
| `test`      | `test: add coverage for session log`   | Add or update tests                      | No bump          | *(optional)*                |
| `perf`      | `perf: improve timer render`           | Performance improvements                 | Patch (if enabled)| *(optional)*              |
| `ci`        | `ci: update GitHub Actions for deploy` | CI/CD changes                            | No bump          | *(optional)*                |

---

## 🔥 Pro Tips

- **No punctuation at the end** of the subject line.
- Keep subject **short, lowercase, and direct**.
- Separate body with a blank line (optional).
- Use scopes for clarity, e.g., `feat(keyholder): ...`

---

## 💬 When in Doubt

Use one of the basics:

- `feat: ...` → For new features
- `fix: ...` → For bug fixes
- `chore: ...` → For config, tooling, and maintenance
