# JEGantic Hospitality Desk

## About

JEGantic Hospitality Desk is a web application designed to help businesses manage and respond to their Google Reviews efficiently. The application integrates with Google Business Profile API to provide a centralized dashboard for monitoring and responding to customer reviews across multiple business locations.

## Features

- Centralized dashboard for monitoring review metrics
- Multi-business review management
- Google Business Profile API integration
- AI-powered review response generation using Claude
- Review filtering and sorting capabilities
- Review response templates
- Real-time metrics and analytics
- Secure user authentication
- Admin user management
- Review response capabilities
- Team and organization management
- Role-based access control

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for data fetching
- Tailwind CSS for styling
- shadcn/ui component library
- Lucide React for icons
- React Router for navigation
- React Hook Form for form handling
- Zod for schema validation

### Backend & Infrastructure
- Supabase for:
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Edge Functions
  - Storage
- Google Business Profile API
- Anthropic's Claude AI for review responses
- Stripe for payments and subscriptions

### Development Tools
- TypeScript
- ESLint
- PostCSS
- Git for version control

## Local Development Setup

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Environment Variables

The following environment variables are required:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

The application is deployed at [https://desk.jegantic.com](https://desk.jegantic.com)

## Contact

For support or inquiries, please contact:
- Email: juan@jegantic.com

## Privacy & Terms

- [Privacy Policy](https://desk.jegantic.com/privacy)
- [Terms of Service](https://desk.jegantic.com/terms)