# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Recharge Storefront API MCP Server
- Complete coverage of Recharge Storefront API with 50+ tools
- Flexible authentication system supporting environment variables and per-tool tokens
- Flexible store URL configuration supporting environment variables and per-tool parameters
- Comprehensive error handling with detailed error messages
- Debug mode with detailed logging capabilities
- Docker support with multi-environment configurations
- Production-ready features including health checks and monitoring
- Complete documentation with examples and troubleshooting guides
- Automated testing and validation scripts
- Security best practices implementation

### Features
- **Customer Management**: Profile updates, preferences, settings
- **Subscription Management**: Complete lifecycle management (create, update, pause, resume, cancel, skip)
- **Address Management**: Full CRUD operations for shipping and billing addresses
- **Payment Methods**: Payment method management and updates
- **Product Catalog**: Browse available products and variants
- **Order History**: View past orders and their status
- **Charge Management**: View upcoming and past charges
- **One-time Products**: Add products to upcoming deliveries
- **Bundle Management**: Handle product bundles and selections
- **Discount Management**: Apply and manage discount codes
- **Notification System**: View and manage customer notifications
- **Session Management**: Customer authentication and session handling
- **Store Configuration**: Access store settings and delivery schedules
- **Async Operations**: Bulk operations via async batch processing
- **Shopify Integration**: Connector configuration and sync settings

### Technical Features
- Model Context Protocol (MCP) compliance
- Zod schema validation for all inputs
- Axios-based HTTP client with interceptors
- Comprehensive error handling and logging
- Environment variable configuration
- Docker containerization
- Health checks and monitoring
- Graceful shutdown handling
- Statistics tracking
- Debug mode support

### Documentation
- Complete README with installation and usage instructions
- Docker deployment guide (DOCKER.md)
- Security policy (SECURITY.md)
- API coverage documentation
- Troubleshooting guides
- Example usage patterns
- Best practices recommendations

### Development Tools
- Automated setup script
- Comprehensive test suite
- Validation and linting tools
- Docker build and deployment scripts
- Coverage reporting
- Statistics tracking

## [Unreleased]

### Planned
- Additional API endpoint coverage as Recharge releases new features
- Enhanced monitoring and metrics
- Performance optimizations
- Additional authentication methods
- Extended documentation and examples

---

## Version History

- **1.0.0**: Initial stable release with complete Recharge Storefront API coverage
- **0.x.x**: Development and beta versions (not publicly released)

## Migration Guide

### From Development to 1.0.0
- No breaking changes - this is the initial stable release
- Ensure environment variables are properly configured
- Update any custom configurations to match the stable API

## Support

For questions, issues, or contributions:
- Check the [README.md](README.md) for documentation
- Review [SECURITY.md](SECURITY.md) for security guidelines
- Create GitHub issues for bugs or feature requests
- Follow the contribution guidelines for pull requests