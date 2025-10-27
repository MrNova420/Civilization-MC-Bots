# Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Security Updates

### Recent Security Fixes

#### v2.0.1 (2025-10-27)
- **Fixed:** High-severity axios vulnerabilities (GHSA-wf5p-g6vw-rhxx, GHSA-jr5f-v2jv-69x6, GHSA-4hjh-wcwx-xvwj)
  - Added package override to force axios ^1.7.4
  - Mitigates CSRF, SSRF, credential leakage, and DoS vulnerabilities
  - No breaking changes to bot functionality

## Reporting a Vulnerability

If you discover a security vulnerability in BetterBender 2.0, please report it by:

1. **DO NOT** open a public issue
2. Email the maintainers with details
3. Include steps to reproduce if possible
4. Allow 48 hours for initial response

## Security Best Practices

### For Deployment

1. **Never commit secrets** to the repository
   - Use `.env` files (already in `.gitignore`)
   - Keep `CONFIG.json` out of version control if it contains sensitive data
   - Use environment variables for production

2. **Dashboard Security**
   - Change the default admin token immediately
   - Use strong, unique tokens (32+ characters)
   - Access dashboard only on trusted networks
   - Consider using HTTPS in production

3. **Network Security**
   - Only connect to trusted Minecraft servers
   - Be aware of server permissions and bot capabilities
   - Monitor bot activities regularly

4. **File System Security**
   - Bot has file system access for logging and state persistence
   - Ensure proper file permissions on config files
   - Regularly backup and clean old logs

### Configuration Security

#### Secure CONFIG.json Example
```json
{
  "auth": {
    "type": "offline",
    "username": "BotName"
  },
  "dashboard": {
    "adminToken": "CHANGE_THIS_TO_LONG_RANDOM_STRING"
  }
}
```

#### Using Environment Variables
```javascript
// In your code, prefer:
const adminToken = process.env.ADMIN_TOKEN || config.dashboard.adminToken;
```

## Dependency Security

### Automated Scanning

We use npm audit to scan for vulnerabilities:

```bash
npm audit
```

### Manual Updates

Check for outdated packages:

```bash
npm outdated
npm update
```

### Package Overrides

For transitive dependencies with vulnerabilities, we use `overrides` in package.json:

```json
{
  "overrides": {
    "axios": "^1.7.4"
  }
}
```

## Security Features

### Built-in Protection

1. **Safe Bot Operations**
   - Input validation on all commands
   - Rate limiting on actions
   - Sandboxed execution environment

2. **Resource Protection**
   - CPU and memory limits
   - Thermal monitoring
   - Automatic throttling

3. **Connection Security**
   - Graceful error handling
   - No credential leakage in logs
   - Secure reconnection logic

## Known Limitations

1. **Bot Permissions**: The bot has the same permissions as a player on the server
2. **Local Access**: Anyone with local access can read config files and logs
3. **Dashboard**: Currently uses HTTP (not HTTPS) - use on trusted networks only

## Security Checklist

Before deploying to production:

- [ ] Changed default admin token to strong, unique value
- [ ] Reviewed and secured CONFIG.json permissions
- [ ] Running on trusted network or with firewall
- [ ] Logs don't contain sensitive information
- [ ] Dependencies are up to date (`npm audit` shows 0 vulnerabilities)
- [ ] Bot connects only to trusted servers
- [ ] File permissions properly set (644 for configs, 755 for scripts)
- [ ] Regular backups configured
- [ ] Monitoring and alerting in place

## Contact

For security concerns, please contact the maintainers through the repository's security advisory feature or via email if available.

---

**Last Updated:** 2025-10-27
