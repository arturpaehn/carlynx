# CarLynx 🚗

![Tests](https://github.com/arturpaehn/carlynx/workflows/Tests/badge.svg)
![Pre-Deploy](https://github.com/arturpaehn/carlynx/workflows/Pre-Deploy%20Checks/badge.svg)

Marketplace for buying and selling cars across Texas and nearby states.

## 🧪 Testing

**Current Status:** 36/36 tests passing ✅

```bash
# Run all tests before commit
npm run precommit

# Full pre-deploy check  
npm run predeploy

# Interactive testing
npm run test:ui
```

See [TESTING.md](./TESTING.md) for detailed testing instructions.

## 🚀 Development

```bash
npm install
npm run dev
```

## 📦 Deployment

Tests run automatically on every push to ensure quality:
- ✅ All E2E tests must pass
- ✅ Build must succeed  
- ✅ No linting errors

---

Made with ❤️ for car enthusiasts