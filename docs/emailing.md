# Emailing with Resend

We are leveraging [Resend](https://resend.com/) for email sending. Emails are used to send the ePub files directly to your Kindle email for the easiest method of getting the books onto your Kindle.

## Resend Setup

1. Sign up for an account at [Resend](https://resend.com/)
2. [Create an API key](https://resend.com/api-keys)
3. [Add a domain](https://resend.com/domains)
4. Setup DNS records for your domain to use Resend

### Resend Environment Variables

```bash
RESEND_API_KEY=...
```

### Resend Documentation

- https://resend.com/docs/introduction
- https://resend.com/docs/send-with-nextjs