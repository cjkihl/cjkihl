# Google Ads API Setup Guide

This guide will walk you through obtaining all the required credentials for the Google Ads API.

## Quick Overview

**Important Note:** The [official Google Ads API documentation](https://developers.google.com/google-ads/api/docs/get-started/make-first-call) shows using **service accounts** with JSON key files. However, the `google-ads-api` npm package we're using primarily supports **OAuth 2.0 with refresh tokens**, which is also a valid and fully supported authentication method. Both methods work with the Google Ads API - the difference is in how authentication is handled.

**Do I need a Google Ads account?**

**Yes, you need a Google Ads account from [ads.google.com](https://ads.google.com/)** for:
- Getting your Developer Token (requires access to Google Ads API Center)
- Getting your Customer ID (found in your Google Ads account)
- Authenticating via OAuth (the account you use for OAuth must have Google Ads access)

**For testing:** You can use a test Google Ads account, but you still need to create one. Google provides test developer tokens for development purposes.

**Two Different Authentication Systems:**

1. **OAuth 2.0 Flow** (for user authentication):
   - `GOOGLE_ADS_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_ADS_CLIENT_SECRET` - From Google Cloud Console  
   - `GOOGLE_ADS_REFRESH_TOKEN` - Generated via OAuth flow (OAuth Playground or script)

2. **Developer Token** (for API access):
   - `GOOGLE_ADS_DEVELOPER_TOKEN` - From Google Ads Console (requires separate application/approval)
   - `GOOGLE_ADS_CUSTOMER_ID` - From Google Ads dashboard

**Note:** The Developer Token is NOT part of OAuth. It's a separate application-level token that identifies your app to Google Ads API and requires approval.

## Required Environment Variables

**Note:** The [official Google Ads API documentation](https://developers.google.com/google-ads/api/docs/get-started/make-first-call) shows using **service accounts** with JSON key files. However, the `google-ads-api` npm package we're using primarily supports **OAuth 2.0 with refresh tokens**, which is also a valid and fully supported authentication method.

You need the following environment variables:

- `GOOGLE_ADS_CLIENT_ID` - OAuth 2.0 Client ID (from Google Cloud Console)
- `GOOGLE_ADS_CLIENT_SECRET` - OAuth 2.0 Client Secret (from Google Cloud Console)
- `GOOGLE_ADS_DEVELOPER_TOKEN` - Google Ads API Developer Token (from Google Ads Console, requires approval)
- `GOOGLE_ADS_REFRESH_TOKEN` - OAuth 2.0 Refresh Token (obtained via OAuth flow)
- `GOOGLE_ADS_CUSTOMER_ID` - Your Google Ads Customer ID (from Google Ads dashboard, also used as `login_customer_id`)

**Quick Reference:**
- **OAuth tokens** (Client ID, Secret, Refresh Token): From Google Cloud Console + OAuth flow
- **Developer Token**: From Google Ads Console (separate application process)
- **Customer ID**: From Google Ads dashboard

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Google Ads API Project")
5. Click **"Create"**

### 2. Enable Google Ads API

1. In your Google Cloud project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Ads API"**
3. Click on it and click **"Enable"**

### 3. Create OAuth 2.0 Credentials (Client ID & Client Secret)

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** (unless you have a Google Workspace account)
   - Fill in the required fields (App name, User support email, Developer contact email)
   - Click **"Save and Continue"**
   - Add scopes: `https://www.googleapis.com/auth/adwords`
   - Click **"Save and Continue"**
   - Add test users if needed (for testing)
   - Click **"Save and Continue"**
   - Review and click **"Back to Dashboard"**

4. Back in Credentials, click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
5. Choose **"Web application"** as the application type
6. Give it a name (e.g., "Google Ads API Client")
7. Under **"Authorized redirect URIs"**, add:
   - `http://localhost:8080` (for local development)
   - Or your production callback URL if applicable
8. Click **"Create"**
9. **Copy the Client ID and Client Secret** - these are your:
   - `GOOGLE_ADS_CLIENT_ID`
   - `GOOGLE_ADS_CLIENT_SECRET`

### 4. Get Developer Token

**Important:** The Developer Token is NOT obtained via OAuth. It's a separate application process that requires approval from Google.

**Prerequisites:** You need a Google Ads account. If you don't have one:
1. Go to [ads.google.com](https://ads.google.com/)
2. Click **"Start now"** or **"Sign in"**
3. Create a Google Ads account (you may need to provide payment info, but won't be charged unless you run ads)

Once you have a Google Ads account:

1. Go to [Google Ads](https://ads.google.com/)
2. Sign in with your Google Ads account
3. Click the **tools icon** (wrench) in the top right
4. Under **"Setup"**, click **"API Center"**
5. If you don't have a developer token yet:
   - Click **"Apply for access"**
   - Fill out the application form
   - Wait for approval (can take a few days)
6. Once approved, you'll see your **Developer Token** - this is your:
   - `GOOGLE_ADS_DEVELOPER_TOKEN`

**Note:** 
- For testing, you can use a test developer token, but you'll need a production token for real data
- This is different from OAuth tokens - it's an application-level identifier, not a user authentication token
- You can create a Google Ads account just for API access - you don't need to run actual ads

### 5. Get Your Customer ID

**You need a Google Ads account for this step.**

1. In [Google Ads](https://ads.google.com/), look at the top right corner
2. You'll see your Customer ID in the format: `XXX-XXX-XXXX`
3. Remove the dashes - this is your:
   - `GOOGLE_ADS_CUSTOMER_ID` (e.g., if it shows `123-456-7890`, use `1234567890`)

**Note:** 
- Even if you create a Google Ads account just for API access (without running ads), you'll still get a Customer ID
- This is used as both `customer_id` and `login_customer_id` in API calls

### 6. Generate Refresh Token

**You need a Google account that has access to Google Ads for this step.** (The account you use for OAuth must be able to access Google Ads.)

You need to generate a refresh token using OAuth 2.0. Here are two methods:

#### Method 1: Using OAuth 2.0 Playground (Easiest)

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check **"Use your own OAuth credentials"**
4. Enter your `GOOGLE_ADS_CLIENT_ID` and `GOOGLE_ADS_CLIENT_SECRET`
5. In the left panel, find **"Google Ads API"** and select:
   - `https://www.googleapis.com/auth/adwords`
6. Click **"Authorize APIs"**
7. Sign in with your Google account and grant permissions
8. Click **"Exchange authorization code for tokens"**
9. Copy the **"Refresh token"** - this is your:
   - `GOOGLE_ADS_REFRESH_TOKEN`

#### Method 2: Using a Script (More Automated)

You can use a Node.js script to generate the refresh token. Here's a simple example:

```javascript
// get-refresh-token.js
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:8080';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = ['https://www.googleapis.com/auth/adwords'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Force to get refresh token
});

console.log('Authorize this app by visiting this url:', authUrl);
open(authUrl);

const server = http.createServer(async (req, res) => {
  const qs = url.parse(req.url, true).query;
  if (qs.code) {
    const { tokens } = await oauth2Client.getToken(qs.code);
    console.log('Refresh Token:', tokens.refresh_token);
    res.end('Refresh token received! Check console.');
    server.close();
  }
}).listen(8080);
```

### 7. Set Environment Variables

Add these to your `.env` file (or `.env.default` / `.env.local` for the monorepo):

```bash
GOOGLE_ADS_CLIENT_ID=your_client_id_here
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_here
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_ADS_CUSTOMER_ID=your_customer_id_without_dashes
```

**Note:** While the [official Google documentation](https://developers.google.com/google-ads/api/docs/get-started/make-first-call) shows service accounts, the `google-ads-api` npm package uses OAuth 2.0 with refresh tokens, which is a fully supported authentication method.

## Testing Your Setup

Once you have all the credentials set up, you can test them by running:

```bash
cd packages/mcp-google-ads
bun test
```

The tests will make real API calls to Google Ads API and validate the response format.

## Troubleshooting

### "Invalid credentials" error
- Double-check that all environment variables are set correctly
- Make sure there are no extra spaces or quotes in your `.env` file
- Verify your Customer ID doesn't have dashes

### "Developer token not approved" error
- Make sure your developer token application has been approved
- For testing, you might need to use a test account

### "Refresh token expired" error
- Generate a new refresh token using the OAuth 2.0 Playground or script
- Make sure to use `prompt: 'consent'` to force getting a refresh token

### "Insufficient permissions" error
- Make sure you've granted the correct scopes (`https://www.googleapis.com/auth/adwords`)
- Verify your OAuth consent screen is configured correctly

## Additional Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [OAuth 2.0 for Google APIs](https://developers.google.com/identity/protocols/oauth2)
- [Google Ads API Authentication Guide](https://developers.google.com/google-ads/api/docs/oauth/overview)

