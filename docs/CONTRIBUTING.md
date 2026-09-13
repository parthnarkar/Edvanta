# Contributing to Edvanta

First off, thank you for considering contributing to Edvanta! It's people like you that make Edvanta a great tool for learners everywhere.

## 🌈 Code of Conduct

By participating in this project, you agree to abide by our code of conduct: be respectful, be inclusive and be constructive.

## 🚀 How Can I Contribute?

### Reporting Bugs
- Check the [Issues](https://github.com/tanish-jain-225/edvanta/issues) page to see if the bug has already been reported.
- If not, open a new issue. Include a clear title, a description of the problem and steps to reproduce.

### Suggesting Enhancements
- Open an issue with the "enhancement" label.
- Explain why this feature would be useful and how it should work.

### Pull Requests
1. **Fork** the repo and create your branch from `main`.
2. **Setup** the environment following the [SETUP.md](docs/SETUP.md).
3. **Make** your changes.
4. **Test** your changes (both frontend and backend).
5. **Lint** your code (`npm run lint` for client).
6. **Submit** a PR with a clear description of what you've done.

---

## 🎨 Style Guidelines

### Git Commit Messages
- Use the present tense ("Add feature" not "Added feature").
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
- Reference issues and pull requests liberally after the first line.

### Frontend (React)
- Follow standard React hooks patterns.
- Use Tailwind CSS for all styling.
- Ensure components are responsive and accessible.
- Use the `edvantaAPI` client for all network requests.

### Backend (Flask)
- Follow PEP 8 style guide.
- Use type hints for function arguments and return values where helpful.
- Ensure all new endpoints have corresponding health checks or tests.

---

### Testing Requirements

- **Frontend Tests**: Run with `npm run test` (Vitest + happy-dom). Must pass all unit and component tests.
- **Frontend Linting**: Run with `npm run lint` (ESLint v9). Zero errors or warnings allowed.
- **Frontend Build**: Run with `npm run build` to ensure production bundle compiles cleanly.
- **Backend Tests**: Run with `pytest` or `pytest --cov=app` in `server/`. Must pass all 63 unit and integration tests.
- **Regression Protection**: Any new bug fix must include a test asserting against the fixed edge case.

---

## 🗺️ Project Structure

```
edvanta/
├── client/     # React 18 + Vite Frontend with Vitest suites
├── server/     # Flask Backend API with Pytest suites
├── docs/       # Documentation (SETUP.md, CONTRIBUTING.md, VIDEO_DEMO.md)
└── .github/    # GitHub Actions CI/CD Pipeline (ci.yml)
```

Happy coding! 🚀
