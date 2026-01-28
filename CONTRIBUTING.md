# Contributing to Resilience Platform Atlas

Thank you for your interest in contributing to the Resilience Platform Atlas! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Issues
- Check if the issue already exists in the [Issues](https://github.com/4usayan-cloud/v0-resilience-platform-atlas/issues) section
- Use a clear and descriptive title
- Provide detailed steps to reproduce the issue
- Include screenshots if applicable
- Specify your environment (OS, browser, Node.js version)

### Suggesting Features
- Open an issue with the `enhancement` label
- Clearly describe the feature and its benefits
- Explain how it aligns with the project goals
- Provide examples or mockups if possible

### Pull Requests

#### Before Submitting
1. Fork the repository
2. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following the code style guidelines
4. Test your changes thoroughly
5. Update documentation if needed

#### Submitting a PR
1. Ensure your code follows the project's coding standards
2. Write clear, concise commit messages
3. Update the CHANGELOG.md with your changes
4. Link any related issues in the PR description
5. Request a review from maintainers

#### PR Guidelines
- **One PR per feature/fix**: Keep PRs focused and manageable
- **Descriptive title**: Use format `feat:`, `fix:`, `docs:`, etc.
- **Clear description**: Explain what changes were made and why
- **Tests**: Add tests for new features (when test infrastructure exists)
- **Documentation**: Update README or other docs if needed

## 💻 Development Setup

### Prerequisites
- Node.js 18+ and pnpm installed
- Git configured
- A code editor (VS Code recommended)

### Local Development
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/v0-resilience-platform-atlas.git
cd v0-resilience-platform-atlas

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev

# Visit http://localhost:3000
```

### Running Checks
```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Build
pnpm build

# Start production build
pnpm start
```

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define proper types/interfaces
- Avoid `any` type when possible
- Use strict mode

### Code Style
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Formatting
- Use 2 spaces for indentation
- Follow ESLint rules (run `pnpm lint`)
- Organize imports (React, third-party, local)

### Component Structure
```typescript
// Good component structure
import React from 'react'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils'

interface MyComponentProps {
  data: string[]
  onAction: () => void
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## 🌍 API Integration Guidelines

### Adding New Data Sources
1. Create utilities in `lib/api-utils.ts`
2. Implement caching with appropriate TTL
3. Add fallback mechanisms
4. Handle errors gracefully
5. Update documentation

### API Route Structure
```typescript
export async function GET(request: Request) {
  try {
    // 1. Check cache
    // 2. Fetch live data
    // 3. Transform data
    // 4. Return with dataSource indicator
  } catch (error) {
    // Return fallback data
  }
}
```

## 📚 Documentation

### What to Document
- New features and APIs
- Configuration changes
- Breaking changes
- Setup requirements
- Usage examples

### Where to Document
- **README.md**: Overview, quick start, main features
- **CHANGELOG.md**: Version history and changes
- **Code comments**: Complex logic and algorithms
- **API docs**: Endpoint behavior and responses

## 🧪 Testing

### Manual Testing Checklist
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] API fallbacks work when APIs fail
- [ ] Loading states are shown
- [ ] Error handling is graceful

### Future: Automated Tests
We plan to add automated testing infrastructure in v1.1. Contributions to set this up are welcome!

## 🚀 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v1.x.x`
4. Push changes: `git push --tags`
5. GitHub Actions will handle deployment

## 🎨 Design Guidelines

### UI/UX Principles
- Keep it simple and intuitive
- Maintain consistency with existing design
- Use Tailwind CSS and Radix UI components
- Follow accessibility standards (WCAG 2.1)

### Color Scheme
- Use existing theme variables
- Support light/dark mode
- Ensure sufficient contrast

## 📞 Getting Help

- **Questions**: Open a discussion in GitHub Discussions
- **Bugs**: Open an issue with detailed information
- **Security**: Email security concerns privately
- **Chat**: Join the v0.app chat for real-time discussions

## 🎯 Project Roadmap

See [CHANGELOG.md](./CHANGELOG.md) for planned features in v1.1:
- WebSocket support for real-time updates
- User authentication
- Custom alert system
- Export functionality
- Advanced ML-based sentiment analysis

## 📜 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards
- Be respectful and constructive
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Enforcement
Violations can be reported to project maintainers. All complaints will be reviewed and investigated.

## 🏆 Recognition

Contributors will be:
- Listed in the project's contributors page
- Mentioned in release notes for significant contributions
- Credited in the CHANGELOG.md

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to the Resilience Platform Atlas!** 🌍

Your contributions help make global resilience monitoring more accessible and effective.
