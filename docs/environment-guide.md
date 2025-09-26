# ChastityOS: Nightly vs Production Environments

This document outlines the key differences between the Nightly and Production versions of ChastityOS.

| Feature               | Nightly                           | Production                     |
| --------------------- | --------------------------------- | ------------------------------ |
| **Firebase Database** | `chastityos-nightly`              | `chastityos-prod`              |
| **Visual Theme**      | Light background, dark borders    | Dark background, light text    |
| **Release Frequency** | Frequent experimental builds      | Manual merges, stable releases |
| **URL**               | `nightly.chastityOS.io`           | `app.chastityOS.io`            |
| **PWA Icon**          | Bright variant with “Nightly”     | Default logo                   |
| **Data Risk**         | 🔄 Subject to resets & migrations | ✅ Persistent & backed         |
| **Feedback Channel**  | `#nightly-feedback`               | `#bug-reports`, GitHub issues  |
| **Version Tagging**   | e.g. `3.6.3-nightly.2`            | e.g. `3.6.1`                   |
| **Use Case**          | Testing new features and fixes    | Day-to-day tracking            |

---

## Notes

- Data does not sync between environments.
- Nightly is intended for active testers and may break.
- Production is stable and receives updates only after validation in Nightly.

For questions, visit the [FAQ](./faq.md) or open a [GitHub issue](https://github.com/thef4tdaddy/chastityOS/issues).
