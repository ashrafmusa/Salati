# Contributing to Salati

First off, thank you for considering contributing to Salati! It's people like you that make Salati such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what behavior you expected to see
- **Include screenshots or animated GIFs** if possible
- **Include your environment details**: OS, browser, Node.js version, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List some examples of how this enhancement would be used**

### Pull Requests

Please follow these steps when submitting a pull request:

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if you've changed functionality
5. **Write clear commit messages** following our commit message guidelines
6. **Submit the pull request** with a clear description of your changes

## 💻 Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ashrafmusa/Salati.git
   cd Salati
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env` (or create a new `.env` file)
   - Fill in your Firebase, Cloudinary, and Gemini API credentials

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Customer App: `http://localhost:5173`
   - Admin Panel: `http://localhost:5173/admin.html`

## 🎨 Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type whenever possible

### React

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use meaningful component and variable names
- Extract reusable logic into custom hooks

### Styling

- Use Tailwind CSS utility classes
- Follow the existing color scheme and design patterns
- Ensure responsive design for mobile, tablet, and desktop

### File Structure

- Place components in the appropriate directory (`src/components/`)
- Keep related files together (component, styles, tests)
- Use descriptive file names

### Code Quality

- Write clean, readable code
- Add comments for complex logic
- Follow DRY (Don't Repeat Yourself) principle
- Remove console.logs before committing
- Ensure no TypeScript errors or warnings

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates, etc.

### Examples

```
feat(auth): add phone authentication with OTP

Add Firebase phone authentication support with OTP verification.
Users can now sign in using their phone number.

Closes #123
```

```
fix(cart): resolve cart merge issue on login

Fixed a bug where guest cart items were not properly merged
with user's cloud cart after login.
```

## 🧪 Testing

Before submitting a pull request:

1. Test your changes in both the customer app and admin panel (if applicable)
2. Test on different screen sizes (mobile, tablet, desktop)
3. Test in different browsers (Chrome, Firefox, Safari)
4. Ensure no console errors or warnings
5. Verify Firebase integration works correctly

## 📞 Questions?

If you have any questions or need help, please:

- Open an issue with the `question` label
- Check existing documentation in the repository
- Review the [ABOUT.md](ABOUT.md) for technical details

## 🎉 Thank You!

Your contributions to open source, large or small, make projects like this possible. Thank you for taking the time to contribute!
