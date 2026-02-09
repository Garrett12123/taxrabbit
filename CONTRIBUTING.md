# Contributing

Thanks for your interest in TaxRabbit! Contributions are welcome.

## Setup

Requires **macOS** and **Node.js 20+**.

```bash
git clone https://github.com/YOUR_USERNAME/taxrabbit.git
cd taxrabbit
npm install
npm run dev
```

The SQLite database and migrations are created automatically on first launch.

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run test:run` and `npm run lint` to verify
4. Open a pull request

## Good to Know

- All sensitive data is encrypted at rest — never log or expose it
- Financial amounts are stored in cents (integers)
- Validation uses Zod schemas in `lib/validation/`
- UI uses shadcn/ui components and Tailwind CSS
- Tests live in `tests/unit/` and use Vitest

## Security Issues

Please report security vulnerabilities privately via GitHub's [security advisory feature](https://github.com/Garrett12123/taxrabbit/security/advisories/new) — not through public issues.
