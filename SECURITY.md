# Security

## Reporting Vulnerabilities

**Please do not report security vulnerabilities through public issues.**

Use GitHub's [private vulnerability reporting](https://github.com/Garrett12123/taxrabbit/security/advisories/new) instead. This is a personal project maintained in my spare time, so response times may vary, but I take security seriously.

## Security Model

TaxRabbit is designed as an offline-first, local-only app. All sensitive data is encrypted at rest.

- **Encryption**: AES-256-GCM with Argon2id key derivation
- **Key Storage**: macOS Keychain for device keys
- **Network**: No external requests during normal operation (enforced at runtime)
- **Auth**: Master password is never stored — only used to derive encryption keys
- **No Telemetry**: Zero analytics or tracking
