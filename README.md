
# JEGantic Hospitality Desk

## About

JEGantic Hospitality Desk is a comprehensive web application designed to help restaurants and hospitality businesses efficiently manage and respond to their Google Reviews. The platform integrates with Google Business Profile API to provide a centralized dashboard for monitoring, analyzing, and responding to customer reviews across multiple business locations.

## Features

### Review Management
- **Centralized Dashboard**: View and manage all reviews from a single interface
- **Multi-Location Support**: Manage reviews for multiple business venues
- **Google Business Profile Integration**: Automatic syncing with Google's review platform
- **Advanced Filtering**: Filter reviews by date, rating, response status, and more
- **Paginated Review Display**: Efficiently browse through large volumes of reviews

### AI-Powered Capabilities
- **Intelligent Response Generation**: Create personalized review replies using Claude AI
- **Review Analysis**: Get AI-powered insights about your reviews and customer sentiment
- **Monthly Performance Reports**: Automatically generated analytics about review patterns

### Analytics & Insights
- **Real-time Metrics**: Monitor key review metrics from your dashboard
- **Response Rate Tracking**: Track how consistently your team responds to reviews
- **Rating Distribution**: Visualize your rating performance over time
- **Monthly Business Insights**: Detailed analysis of review trends and patterns

### User Management
- **Secure Authentication**: Role-based access control for team members
- **Team Collaboration**: Multiple team members can manage reviews
- **Organization Management**: Create a hierarchy for multi-location businesses

### Interface & Experience
- **Responsive Design**: Works seamlessly on desktops, tablets, and mobile devices
- **Intuitive Interface**: User-friendly design focused on productivity
- **Dark/Light Mode**: Choose your preferred visual theme
- **Real-time Updates**: See new reviews as they come in

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
- Anthropic's Claude AI for review analysis and responses

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

## Pricing

JEGantic Hospitality Desk offers several pricing tiers:

- **Free**: Single business management, basic review monitoring
- **Standard**: Multi-business review management, basic analytics
- **Premium**: AI-powered responses, advanced analytics, unlimited locations
- **Enterprise**: Custom AI training, dedicated support, API access

## Contact

For support or inquiries, please contact:
- Email: juan@jegantic.com

## Privacy & Terms

- [Privacy Policy](https://desk.jegantic.com/privacy)
- [Terms of Service](https://desk.jegantic.com/terms)
