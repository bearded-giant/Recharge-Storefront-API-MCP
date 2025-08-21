# Contributing to Recharge Storefront API MCP Server

Thank you for your interest in contributing to this project! This guide will help you get started with contributing effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Documentation](#documentation)
- [Security](#security)

## Code of Conduct

This project follows a standard code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Report any unacceptable behavior

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git for version control
- Docker (optional, for containerized development)

### Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/recharge-storefront-api-mcp.git
   cd recharge-storefront-api-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your development credentials
   ```

4. **Run setup script:**
   ```bash
   npm run setup
   ```

5. **Verify installation:**
   ```bash
   npm run validate
   npm run test:full
   ```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-endpoint`
- `fix/error-handling-issue`
- `docs/update-readme`
- `refactor/improve-client-structure`

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(tools): add new subscription management tool`
- `fix(client): resolve authentication token handling`
- `docs(readme): update installation instructions`
- `refactor(server): improve error handling structure`

### Types of Changes

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

## Development Guidelines

### Adding New Tools

When adding new API tools:

1. **Create tool file:**
   ```bash
   # Create new file in src/tools/
   touch src/tools/new-feature-tools.js
   ```

2. **Follow existing patterns:**
   ```javascript
   import { z } from 'zod';

   const baseSchema = z.object({
     access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
     store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
   });

   export const newFeatureTools = [
     {
       name: 'tool_name',
       description: 'Clear description of what the tool does',
       inputSchema: baseSchema.extend({
         // Add specific parameters
       }),
       execute: async (client, args) => {
         // Implementation
       },
     },
   ];
   ```

3. **Update tool index:**
   ```javascript
   // In src/tools/index.js
   import { newFeatureTools } from './new-feature-tools.js';
   
   export const tools = [
     // ... existing tools
     ...newFeatureTools,
   ];
   ```

4. **Add client methods:**
   ```javascript
   // In src/recharge-client.js
   async newFeatureMethod(params) {
     validateRequiredParams(params, ['required_param']);
     return this.makeRequest('GET', '/endpoint', null, params);
   }
   ```

### Code Quality Standards

- **ESLint compliance**: Follow existing linting rules
- **Error handling**: Always include proper error handling
- **Input validation**: Use Zod schemas for all inputs
- **Documentation**: Add JSDoc comments for all functions
- **Testing**: Include tests for new functionality

### File Organization

- `src/server.js` - Main MCP server implementation
- `src/recharge-client.js` - Recharge API client
- `src/tools/` - Individual tool implementations
- `src/utils/` - Utility functions
- `scripts/` - Build and deployment scripts
- `docs/` - Additional documentation

## Testing

### Running Tests

```bash
# Run all tests
npm run test:full

# Run specific tests
npm run test:api-keys
npm run validate
npm run lint
```

### Writing Tests

- Add tests for new functionality
- Test error conditions
- Verify input validation
- Test authentication scenarios

### Test Structure

```javascript
// Example test structure
console.log('Test: Description of what is being tested');
try {
  // Test implementation
  console.log('✅ Test passed');
} catch (error) {
  console.log('❌ Test failed:', error.message);
}
```

## Submitting Changes

### Pull Request Process

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

3. **Run tests:**
   ```bash
   npm run test:full
   npm run validate
   ```

4. **Push changes:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create pull request:**
   - Use descriptive title and description
   - Reference any related issues
   - Include testing information
   - Add screenshots if applicable

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests pass locally
- [ ] New tests added (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## Code Style

### JavaScript/Node.js Standards

- Use ES6+ features and modules
- Follow existing indentation (2 spaces)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Handle errors appropriately
- Use async/await for asynchronous operations

### Documentation Standards

- Update README.md for user-facing changes
- Add JSDoc comments for all functions
- Include examples in documentation
- Update CHANGELOG.md for releases

## Documentation

### Types of Documentation

- **Code comments**: Explain complex logic
- **JSDoc**: Document all public APIs
- **README**: User-facing documentation
- **Examples**: Practical usage examples
- **Troubleshooting**: Common issues and solutions

### Documentation Guidelines

- Write clear, concise explanations
- Include practical examples
- Keep documentation up-to-date
- Use proper markdown formatting
- Include error handling examples

## Security

### Security Guidelines

- Never commit API tokens or secrets
- Sanitize sensitive data in logs
- Follow secure coding practices
- Report security issues privately
- Use environment variables for configuration

### Security Review

All contributions undergo security review:
- Code analysis for vulnerabilities
- Dependency security scanning
- Authentication and authorization checks
- Input validation verification

## Getting Help

### Resources

- **Documentation**: Check README.md and other docs
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Code**: Review existing code for patterns

### Contact

- Create GitHub issues for bugs
- Use discussions for questions
- Follow security reporting guidelines for vulnerabilities

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- GitHub contributors list
- Release notes for major features

Thank you for contributing to make this project better!