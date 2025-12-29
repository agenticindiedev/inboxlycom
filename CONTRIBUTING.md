# Contributing to AI Email Client

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/ai-email-client.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit: `git commit -m "Add your feature"`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Development Setup

### Prerequisites
- Bun runtime
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Node.js 18+ (if not using Bun)

### Installation

```bash
cd apps/ai-email-client
bun install
```

### Environment Variables

Copy `.env.example` files and configure:
- Database URLs
- Redis URL
- OAuth2 credentials
- AI API keys

### Running

```bash
# Run all apps
bun run dev

# Or individually
bun run dev:api   # Backend
bun run dev:web   # Frontend
```

## Code Style

- Use TypeScript for all code
- Follow existing code patterns
- Use Prettier for formatting: `bun run format`
- Run linter: `bun run lint`

## Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new features
4. Ensure code follows style guidelines
5. Request review from maintainers

## Reporting Issues

Use GitHub Issues to report bugs or request features. Include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

