# Security Policy

## Supported Versions

This project is currently supported on the latest `main` branch.

## Reporting a Vulnerability

Do not open a public GitHub issue for sensitive vulnerabilities.

Report security issues privately to the repository owner through GitHub security reporting if enabled, or through a private contact channel controlled by the maintainer.

Include:

- affected version or commit
- reproduction steps
- impact
- suggested mitigation if available

## Secret Handling

- Never commit `.env`
- Use dedicated credentials for Discord, Linear, and OpenAI
- Rotate credentials immediately if they appear in terminal output, screenshots, chat transcripts, or commit history
- Review Railway or hosting platform logs to ensure secrets are not printed
