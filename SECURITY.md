# Security policy

## Reporting
Please report suspected vulnerabilities privately through GitHub Security Advisories for this repository. Do not publish beneficiary names, phone numbers, addresses, backup files, Telegram bot tokens, or Google Apps Script URLs in issues.

## Data handling rules
- Never commit family/beneficiary data or exported backup JSON files.
- Never commit Telegram bot tokens, passwords, or private integration credentials.
- Sentry must not receive beneficiary names, phone numbers, addresses, Telegram tokens, backup contents, or Google Sheets payloads.
- Keep the repository private.
- Rotate any token accidentally committed; deleting the file in a later commit does not remove it from Git history.

## Scope
The QA workflows check source integrity, regression contracts, and JavaScript security patterns. They cannot guarantee that an application is completely free of defects.
