# Phantasmagoria Alumni Platform

A professional web application for Westminster Alumni to showcase their credentials, connect with sponsors, and participate in a blind bidding system for the "Alumni Influencer of the Day" slot.

## Features

### Alumni
- **Credential Portfolio**: Showcase degrees, certifications, and professional courses.
- **Employment History**: Managed employment timeline.
- **Sponsorship System**: Receive and accept sponsorship offers from companies.
- **Blind Bidding**: Place bids using a wallet balance (funded by sponsors) to become the "Alumni of the Day".

### Sponsors
- **Alumni Discovery**: Browse verified alumni profiles and credentials.
- **Direct Sponsorship**: Make targeted offers to alumni based on specific certifications or licences.
- **Dashboard**: Track sent, accepted, and rejected offers.

### Developers
- **API Management**: Generate scoped API keys (read:alumni, read:analytics, etc.).
- **Usage Tracking**: Monitor API request logs and statistics.
- **Analytics Dashboard**: Access live charts on skills gaps, employment trends, and geographic distribution.

## Tech Stack
- **Backend**: Node.js, Express
- **Database**: MySQL / SQLite (via Sequelize ORM)
- **Frontend**: EJS Templates, Bootstrap 5, Chart.js
- **Security**: JWT (HttpOnly cookies), CSRF Protection, bcrypt hashing, express-validator, Rate Limiting, Helmet CSP.

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- MySQL or SQLite

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy the `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
Key variables:
- `JWT_SECRET`: Secret for session signing.
- `ANALYTICS_API_KEY`: A master key for internal analytics fetching.
- `SMTP_*`: Credentials for email notifications.

### 4. Database Setup
The application uses Sequelize. Models will sync automatically on startup.
```bash
# To force sync (caution: deletes data)
# Change db.sync() to db.sync({ force: true }) in index.js temporarily
```

### 5. Running the App
```bash
# Development mode
npm start

# The app will be available at http://localhost:3000
```

## API Documentation
The full API specification is available via Swagger at:
`http://localhost:3000/api-docs`

## Scheduled Tasks
- **Daily Winner Selection**: Automatically picks the highest bidder at 6:00 PM daily.
- **Monthly Reset**: Clears winning limits on the 1st of every month.
- **Cleanup**: Prunes expired sessions and CSRF tokens at midnight.
