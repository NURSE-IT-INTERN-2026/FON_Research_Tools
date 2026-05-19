# CMU OAuth Reference

This reference captures a reusable CMU OAuth 2.0 integration pattern for CMU-backed web apps. Adapt redirect targets, account-linking rules, and optional faculty gating to the current project.

## External Providers

- Authorize endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- Token endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- User info endpoint: `https://api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo`
- CMU tenant ID: `cf81f1df-de59-4c29-91da-a2dfd04aa751`

## Required Environment Variables

- `CMU_CLIENT_ID`
- `CMU_CLIENT_SECRET`
- `CMU_OAUTH_URL`
- `CMU_TOKEN_URL`
- `CMU_USERINFO_URL`
- `CMU_SCOPE`
- `CMU_REDIRECT_URI`
- `NEXT_PUBLIC_APP_URL`

`CMU_REDIRECT_URI` must exactly match the value registered with CMU OAuth.

## Core Flow

1. `GET /api/auth/cmu`
   - generate a random `state`
   - persist it as an httpOnly `oauth_state` cookie for 10 minutes
   - redirect the browser to the Microsoft authorize URL

2. `GET /api/auth/cmu/callback`
   - compare callback `state` with the `oauth_state` cookie
   - exchange the authorization `code` for an access token
   - fetch CMU basic profile data using the access token
   - optionally require a specific `organization_code` or faculty rule
   - link or upsert the local user record
   - reject inactive users
   - issue app auth cookies or JWTs
   - clear the `oauth_state` cookie
   - redirect by role and onboarding state

3. Post-login redirect rules
   - privileged roles often go to a dashboard or operations home
   - users missing consent or onboarding go to a gate page
   - all other successful users go to their normal role home

## CMU User Fields Used by the App

- `cmuitaccount`
- `cmuitaccount_name`
- `firstname_TH`
- `lastname_TH`
- `firstname_EN`
- `lastname_EN`
- `student_id`
- `organization_code`

## Stable Error Codes

- `oauth_state_mismatch`
- `oauth_token_failed`
- `oauth_userinfo_failed`
- `not_allowed_faculty`
- `account_disabled`
- `oauth_error`

## Security Constraints

- keep the client secret server-side only
- use the CMU access token once and do not store it
- keep `oauth_state` short-lived and httpOnly
- reject invalid state before token exchange

## Source of Truth

This reference should be kept in sync with any repo-specific CMU OAuth documentation when the integration contract changes.
