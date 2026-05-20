# Security Policy for ashe-360

We take the security of the ashe-360 repository and our live application at [https://ashe.eds-360.com](https://ashe.eds-360.com) very seriously. We appreciate the efforts of the security community in helping us maintain a secure environment.

## Scope

This vulnerability disclosure policy applies to:
* The source code within this repository (`ashe-360`).
* The production web application hosted at `https://ashe.eds-360.com`.

**Out of Scope:**
* Third-party services, dependencies, or infrastructure outside of our direct control.
* Volumetric vulnerabilities, such as Denial of Service (DoS) or Distributed Denial of Service (DDoS) attacks.
* Social engineering or physical attacks against our users or infrastructure.

## Rules of Engagement

If you are a security researcher testing our live application at `https://ashe.eds-360.com`, please adhere to the following rules:
* **Do no harm:** Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our service.
* **Do not exploit:** If you find a vulnerability, do not exploit it beyond what is strictly necessary to prove its existence. Do not use it to access, modify, or delete user data.
* **Keep it private:** Please do not publicly disclose the vulnerability until we have had a reasonable amount of time to patch it.

## Supported Versions

| Version/Branch | Supported          |
| -------------- | ------------------ |
| `main` branch  | :white_check_mark: |
| < `main`       | :x:                |

*(Note: If you use version numbers like v1.0, replace `main` with your versioning structure).*

## Reporting a Vulnerability

If you believe you have found a security vulnerability, please report it to us immediately. 

**Do not open a public GitHub issue.** Instead, please report the vulnerability using one of the following methods:

1. **GitHub Private Vulnerability Reporting:** Go to the "Security" tab of this repository, click "Advisories," and select "Report a vulnerability."
2. **Email:** Send a detailed report to audit@emergingdefensesolutions.com.

**Please include the following in your report:**
* A clear description of the vulnerability.
* The specific URL or code file where the vulnerability exists.
* Detailed steps to reproduce the issue (including any payloads or scripts used).
* The potential impact of the vulnerability.

## What to Expect

* We will acknowledge receipt of your report within [e.g., 48 hours].
* We will investigate the issue and keep you updated on our progress.
* Once the vulnerability is resolved, we will notify you and may offer public acknowledgment for your responsible disclosure (with your permission).
