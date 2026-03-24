# Contributing to OasisSDF

Thank you for your interest in contributing to OasisSDF! We welcome contributions from the community and appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Code Review](#code-review)
- [License](#license)

## Code of Conduct

We expect all contributors to adhere to our code of conduct. Please be respectful and inclusive in all interactions with the community.

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- A modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Git

### Development Setup

1. **Fork the repository**
   - Click the "Fork" button on the GitHub repository page

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/OasisSDF.git
   cd OasisSDF
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

## Coding Standards

### TypeScript
- Use strict mode (`strict: true` in tsconfig.json)
- No `any` type unless absolutely necessary
- PascalCase for classes and interfaces
- camelCase for variables and functions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### WGSL
- snake_case for functions and variables
- Add comments for complex math operations
- Follow WebGPU shader best practices
- Keep shaders static (no dynamic code generation)

### File Naming
- Kebab-case for assets (e.g., `shader.wgsl`)
- PascalCase for TypeScript logic files (e.g., `Engine.ts`)
- Lowercase for directory names

### Code Structure
- Follow the existing module structure
- Keep files focused on a single responsibility
- Limit file size to 500 lines or less
- Extract shared logic into utility modules

## Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Development branch
- **feature/**: Feature branches (e.g., `feature/new-material-type`)
- **fix/**: Bug fix branches (e.g., `fix/memory-leak`)
- **docs/**: Documentation branches (e.g., `docs/update-api-docs`)

### Commit Messages

Follow the Conventional Commits format:

```
<type>(<scope>): <description>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build or CI changes

**Example:**
```
feat(material): add PBR material support

Add Physically Based Rendering (PBR) material system with metallic and roughness properties.

Closes #42
```

### Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   git commit -m "feat(scope): description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the GitHub repository page
   - Click "Pull requests"
   - Click "New pull request"
   - Select your branch
   - Fill out the PR template
   - Click "Create pull request"

### PR Template

When creating a pull request, please use the following template:

```markdown
## Description

Brief description of the changes made.

## Changes Made

- List of changes made
- More detailed explanation if needed

## Related Issues

- Fixes #123
- Related to #456

## Testing

How the changes were tested:
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots (if applicable)

Add screenshots to show the changes if relevant.

## Checklist

- [ ] I have followed the coding standards
- [ ] I have added tests for new functionality
- [ ] I have updated documentation
- [ ] I have run the test suite
- [ ] All tests pass
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/unit/engine.test.ts
```

### Writing Tests

- Write unit tests for new functionality
- Test edge cases
- Use descriptive test names
- Follow the existing test patterns

## Documentation

- Update documentation for new features
- Keep API documentation up to date
- Add examples for new functionality
- Follow the existing documentation style

## Reporting Bugs

When reporting bugs, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (browser, OS, etc.)
- Screenshots if applicable
- Minimal reproduction case if possible

## Feature Requests

When requesting new features, please include:

- A clear and descriptive title
- Detailed description of the feature
- Use case for the feature
- Any relevant examples or references
- Potential implementation approach (if you have ideas)

## Code Review

### Reviewing Pull Requests

When reviewing PRs:
- Check for adherence to coding standards
- Verify that tests pass
- Ensure documentation is updated
- Provide constructive feedback
- Approve PRs that meet the project's standards

### Receiving Code Review

When receiving code review:
- Be open to feedback
- Address all review comments
- Make necessary changes
- Rebase and push updates
- Thank reviewers for their time

## License

By contributing to OasisSDF, you agree that your contributions will be licensed under the MIT License.

## Contact

If you have any questions or need help getting started, please:

- Open an issue on GitHub
- Join the project discussions
- Contact the maintainers

Thank you for contributing to OasisSDF! 🚀
