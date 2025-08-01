# Security Deployment Guide

## 🔒 Production Security Checklist

This guide covers the security implementations and deployment requirements for the Guiñote game.

### ✅ Implemented Security Features

#### Authentication & Authorization
- [x] **Strong Password Policy**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- [x] **Rate Limiting**: 5 authentication attempts per 15 minutes per IP
- [x] **Account Lockout**: 5 failed attempts locks account for 30 minutes  
- [x] **Secure Session Management**: JWT tokens with refresh token rotation
- [x] **Input Validation**: All user inputs are validated and sanitized

#### Network Security
- [x] **HTTPS Enforcement**: Automatic HTTP to HTTPS redirect in production
- [x] **Security Headers**: HSTS, CSP, X-Frame-Options, and more via Helmet
- [x] **CORS Configuration**: Restricted to specific domains in production
- [x] **Rate Limiting**: API-wide rate limiting (100 requests per 15 minutes)

#### Data Protection
- [x] **Password Hashing**: bcrypt with salt rounds
- [x] **Input Sanitization**: XSS protection via DOMPurify
- [x] **Error Handling**: No sensitive information leakage in production
- [x] **Request Validation**: All API requests validated and sanitized

## 🚀 Deployment Setup

### 1. Android Release Keystore

#### Generate Production Keystore
```bash
# Generate a new keystore for release builds
keytool -genkeypair -v -keystore guinote-release-key.keystore -alias guinote-release -keyalg RSA -keysize 2048 -validity 10000

# Follow the prompts to set:
# - Keystore password (store securely)
# - Key alias password (store securely)
# - Your organization details
```

#### Configure Gradle Properties
```bash
# Copy the example file
cp android/gradle.properties.example android/gradle.properties

# Edit android/gradle.properties with your values:
GUINOTE_UPLOAD_STORE_FILE=../guinote-release-key.keystore
GUINOTE_UPLOAD_KEY_ALIAS=guinote-release
GUINOTE_UPLOAD_STORE_PASSWORD=your-secure-store-password
GUINOTE_UPLOAD_KEY_PASSWORD=your-secure-key-password
```

⚠️ **IMPORTANT**: Never commit `gradle.properties` or `*.keystore` files to version control!

### 2. Server Environment Variables

#### Required Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://username:password@host:port/guinote
REDIS_URL=redis://username:password@host:port

# JWT Secrets (generate strong random values)
JWT_SECRET=your-256-bit-secret-key-here
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-key-here
JWT_EXPIRE_TIME=15m
JWT_REFRESH_EXPIRE_TIME=7d

# CORS
CLIENT_URL=https://your-domain.com

# Game Settings
MAX_PLAYERS_PER_ROOM=4
MATCHMAKING_TIMEOUT=120000
ELO_K_FACTOR=32
```

#### Generate Secure JWT Secrets
```bash
# Generate 256-bit secrets (recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Production Deployment

#### Before Deployment
1. **Update Server URL**: Set `REACT_APP_SERVER_URL` environment variable
2. **Generate Release Keystore**: Follow Android keystore setup above
3. **Configure Environment Variables**: Set all required environment variables
4. **Test Security Features**: Run security tests with `npm test`

#### Deploy Server
```bash
# Install dependencies
npm install --production

# Run security tests
npm test

# Start production server
NODE_ENV=production npm start
```

#### Build Android Release
```bash
# Ensure keystore is configured
cd android

# Build release APK
./gradlew assembleRelease

# Or build release bundle
./gradlew bundleRelease
```

## 🛡️ Security Monitoring

### Log Monitoring
The application logs security events including:
- Failed authentication attempts
- Account lockouts
- Rate limit violations
- Input validation failures
- Security header violations

### Recommended Monitoring
- Set up alerts for repeated failed login attempts
- Monitor rate limit violations
- Track authentication patterns
- Log and monitor server errors

## 🔍 Security Testing

### Running Security Tests
```bash
# Server security tests
cd server
npm test

# Specific test suites
npm test src/utils/validation.spec.js
npm test src/middleware/sanitizer.spec.js
npm test src/middleware/rateLimiter.spec.js
npm test src/models/Player.spec.js
```

### Manual Security Testing
1. **Password Policy**: Try registering with weak passwords
2. **Rate Limiting**: Make repeated login attempts
3. **Input Sanitization**: Submit forms with HTML/script tags
4. **HTTPS Redirect**: Access HTTP URLs in production
5. **Account Lockout**: Make 5+ failed login attempts

## 📋 Security Maintenance

### Regular Tasks
- [ ] Rotate JWT secrets quarterly
- [ ] Update dependencies monthly
- [ ] Review server logs weekly
- [ ] Test security features before releases
- [ ] Monitor for new security vulnerabilities

### Security Updates
- Keep all dependencies updated
- Monitor security advisories for Node.js and npm packages
- Review and update security policies regularly
- Conduct security audits before major releases

## 🚨 Incident Response

### If Security Breach Detected
1. **Immediate**: Rotate all JWT secrets
2. **Urgent**: Force logout all users
3. **Critical**: Review server logs for affected accounts
4. **Important**: Update security measures if needed
5. **Follow-up**: Notify affected users if necessary

### Emergency Contacts
- Development Team: [your-team-email]
- Security Team: [security-team-email]
- Infrastructure Team: [infrastructure-team-email]

---

## 📞 Support

For questions about security implementation or deployment:
- Check the [troubleshooting guide](./TROUBLESHOOTING.md)
- Review the [server logs](./server/logs/)
- Contact the development team

**Remember**: Security is an ongoing process, not a one-time setup!