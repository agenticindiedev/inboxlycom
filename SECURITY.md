# Security Documentation

## Encryption

### Credential Storage
- All email account credentials are encrypted using AES-256-GCM
- Encryption key is stored in environment variable `ENCRYPTION_KEY`
- OAuth2 tokens are also encrypted before storage

### Implementation
- `EncryptionService` handles all encryption/decryption operations
- Credentials are encrypted before saving to MongoDB
- Decryption happens only when needed for IMAP/SMTP connections

## Data Privacy

### Email Data
- Email content is stored in MongoDB (can be encrypted at rest if needed)
- No email content is sent to AI providers without user consent
- AI summaries and categorizations are cached but can be cleared

### Compliance
- GDPR: Users can request data deletion
- Data retention policies can be configured
- Audit logging for sensitive operations

## Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS Only**: All API communications must use TLS
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **Input Validation**: All user inputs are validated
5. **SQL Injection**: Using Mongoose prevents SQL injection
6. **XSS Protection**: Frontend sanitizes HTML content

## Security Checklist

- [x] Credential encryption
- [x] OAuth2 token encryption
- [ ] End-to-end email encryption (optional)
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Audit logging
- [ ] Security headers
- [ ] CORS configuration
- [ ] Session management

