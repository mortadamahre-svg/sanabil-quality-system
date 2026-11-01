# Sanabil QA Operations

## Automated gates
GitHub Actions runs the following checks on pushes and pull requests to `main`:
- Quality Assurance: JavaScript syntax, local asset/build checks, application regression contracts, and whitespace checks.
- CodeQL: JavaScript security analysis using the `security-extended` query suite.
- Android APK Build: creates and verifies a debug APK, then uploads it as the `Sanabil-Android-APK` workflow artifact.

Run each workflow manually from Actions when needed. A successful workflow means its configured checks passed; it is not proof that every device, Android version, or business scenario has been manually tested.

## Sentry error monitoring
The browser SDK is loaded through the Sentry Loader in `index.html` and initialized by `sentry-init.js`.
Privacy controls disable default PII, breadcrumbs, tracing, and session replay. Event payloads are redacted before sending so beneficiary records and app data are not intentionally attached.

### Verify live delivery
1. Open the Sentry project connected to this app.
2. Open the deployed app in a test browser/device with network access.
3. Trigger a controlled test exception only in a non-production test session, or use Sentry's supported test-event procedure.
4. Confirm a new issue appears in Sentry with the expected project/environment.
5. Do not use real beneficiary names, phone numbers, addresses, backup files, or tokens in test events.

The repository configuration alone cannot prove that Sentry has received an event. Treat live delivery as unverified until the test issue is visible in the Sentry project.

## Release checklist
- Confirm Quality Assurance, CodeQL, and Android APK Build workflows pass for the same commit.
- Download the APK artifact from that exact successful Android workflow run.
- Install and smoke-test on a real Android device: launch, family create/edit/search, distribution, calculations, reports, backup/restore, and relaunch persistence.
- Verify Sentry delivery separately as described above.
- Keep citizen data and integration credentials out of Git history and issue reports.

## Known limitations
- CodeQL currently runs local analysis with SARIF upload disabled because GitHub code-scanning upload entitlement is not enabled for this repository. A successful run does not mean findings appear in the GitHub Security tab.
- Debug APKs are for testing and installation; they are not a Play Store release-signed package.
- Automated tests reduce regression risk but cannot guarantee zero defects.
