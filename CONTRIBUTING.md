# Contributing to BetterBender 2.0 / Civilization-MC-Bots

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- A Minecraft account (for testing)

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Civilization-MC-Bots.git
cd Civilization-MC-Bots

# 2. Install dependencies
npm install

# 3. Copy example configuration
cp CONFIG.example.json CONFIG.json

# 4. Edit CONFIG.json with your settings

# 5. Run tests
npm run test:all

# 6. Run linter
npm run lint
```

---

## 📝 Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/trading-system`)
- `fix/` - Bug fixes (e.g., `fix/database-schema`)
- `docs/` - Documentation updates (e.g., `docs/api-reference`)
- `test/` - Test additions (e.g., `test/unit-tests`)
- `refactor/` - Code refactoring (e.g., `refactor/cleanup`)

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Build/tool changes

**Examples:**
```
feat(trading): add item valuation engine

fix(database): add missing columns to bots table

docs(readme): update installation instructions

test(core): add unit tests for TaskManager
```

### Pull Request Process

1. **Create a branch** from `main`
2. **Make your changes** with clear commits
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run all tests**: `npm run test:all`
6. **Run linter**: `npm run lint`
7. **Push to your fork**
8. **Open a Pull Request** with a clear description

---

## 🧪 Testing Guidelines

### Required Tests

All new features must include:
- **Unit tests** for individual functions
- **Integration tests** for module interactions
- **Documentation** for usage

### Running Tests

```bash
# Run all tests
npm run test:all

# Run smoke tests only
npm test

# Run unit tests only
npm run test:unit

# Run with coverage (when available)
npm run test:coverage
```

### Writing Tests

Place tests in the `test/` directory:

```javascript
// test/unit/my-feature.test.js
const assert = require('assert');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}:`, err.message);
    process.exit(1);
  }
}

test('Feature works correctly', () => {
  const result = myFeature();
  assert(result === expected, 'Should return expected value');
});
```

---

## 💻 Code Style

### ESLint

We use ESLint for code quality:

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Best Practices

1. **Use descriptive variable names**
   ```javascript
   // Good
   const playerHealth = bot.health;
   
   // Bad
   const h = bot.health;
   ```

2. **Add comments for complex logic**
   ```javascript
   // Calculate exponential backoff delay for reconnection
   const delay = Math.min(baseDelay * Math.pow(multiplier, attempts), maxDelay);
   ```

3. **Handle errors properly**
   ```javascript
   try {
     await dangerousOperation();
   } catch (error) {
     logger.error('Operation failed:', error.message);
     // Handle error appropriately
   }
   ```

4. **Prefix unused parameters with underscore**
   ```javascript
   function callback(_error, result) {
     return result;
   }
   ```

---

## 📚 Documentation

### Required Documentation

When adding features, update:
- **README.md** - If user-facing feature
- **API documentation** - For new APIs
- **CHANGELOG.md** - All changes
- **Code comments** - For complex logic

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep examples up-to-date

---

## 🔒 Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Review `SECURITY.md`
2. Report via security advisory
3. Wait for maintainer response

### Security Checklist

- [ ] No secrets in code
- [ ] Input validation added
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention
- [ ] Dependencies updated

---

## 🎯 Areas for Contribution

### High Priority

1. **Testing**
   - Integration tests
   - End-to-end tests
   - Test coverage improvement

2. **Features**
   - Complete building system
   - Trading system implementation
   - Village formation logic

3. **Documentation**
   - API reference
   - Video tutorials
   - More examples

### Medium Priority

1. **Performance**
   - Optimization profiling
   - Memory leak detection
   - CPU usage optimization

2. **UI/UX**
   - Dashboard improvements
   - Better visualizations
   - Mobile responsiveness

3. **DevOps**
   - Kubernetes manifests
   - Monitoring dashboards
   - Deployment automation

### Good First Issues

Look for issues labeled `good first issue` or `help wanted`.

---

## 🤝 Code Review Process

### What We Look For

1. **Code Quality**
   - Follows style guide
   - No ESLint errors
   - Well-structured

2. **Testing**
   - Adequate test coverage
   - Tests pass
   - Edge cases handled

3. **Documentation**
   - Clear commit messages
   - Updated documentation
   - Code comments where needed

4. **Security**
   - No vulnerabilities introduced
   - Proper input validation
   - Secrets management

### Review Timeline

- Initial review: Within 48 hours
- Follow-up: Within 24 hours
- Merge: After approval and CI passes

---

## 📊 Project Structure

```
Civilization-MC-Bots/
├── .github/           # GitHub Actions workflows
├── addons/            # Bot addons (afk, player, mining, etc.)
├── civilization/      # Civilization mode files
│   ├── core/         # Core civilization logic
│   ├── db/           # Database management
│   ├── personalities/ # Bot personalities
│   └── scripts/      # Utility scripts
├── dashboard/         # Web dashboard
├── src/              # Core bot engine
│   ├── core/         # Core modules
│   └── utils/        # Utility functions
├── test/             # Test files
├── docs/             # Documentation
└── data/             # Runtime data (not in repo)
```

---

## 🛠️ Troubleshooting

### Common Issues

**Tests failing:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run test:all
```

**ESLint errors:**
```bash
npm run lint:fix
```

**Database errors:**
```bash
rm -rf data/civilization/*.db*
# Restart bot to recreate database
```

---

## 📞 Getting Help

- **Documentation**: Start with [DOCS_INDEX.md](DOCS_INDEX.md)
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Questions**: Open an issue with `question` label

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🎉 Recognition

Contributors are recognized in:
- `CHANGELOG.md`
- Release notes
- Contributors list

---

**Thank you for contributing to BetterBender 2.0!** 🤖
