# Handwork Admin Panel

Admin dashboard for the Handwork marketplace platform. Built with Next.js 14, React 18, and TailwindCSS.

## Features

- **Dashboard Analytics** - Overview of orders, users, revenue, and key metrics
- **User Management** - View and manage buyers, farmers, and riders
- **Order Management** - Track and manage all orders across the platform
- **Product Management** - Review and moderate product listings
- **Rider Management** - Approve rider applications, track performance
- **Farmer Management** - Verify farmer accounts, manage approvals
- **Support Tickets** - Handle customer support requests
- **Reports** - View and resolve user reports
- **Promotions** - Create and manage promotional campaigns
- **Analytics** - Detailed reports and insights

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Charts**: Recharts
- **UI Components**: Custom components with Radix UI primitives

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend API running (see backend README)

## Environment Variables

Create a `.env.local` file in the admin directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
```

## Installation

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
admin/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── users/           # User management
│   │   ├── orders/          # Order management
│   │   ├── products/        # Product management
│   │   ├── riders/          # Rider management
│   │   ├── farmers/         # Farmer management
│   │   ├── support/         # Support tickets
│   │   └── settings/        # Admin settings
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions
│   └── store/               # Zustand stores
├── public/                  # Static assets
└── tailwind.config.ts       # TailwindCSS configuration
```

## Available Scripts

```bash
# Development
npm run dev         # Start development server

# Production
npm run build       # Build for production
npm run start       # Start production server

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript checks
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Docker

```bash
# Build Docker image
docker build -t handwork-admin .

# Run container
docker run -p 3000:3000 handwork-admin
```

### Manual

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## Admin Access

Default admin accounts are created during backend seeding:

- **Email**: admin@handwork.com
- **Password**: Admin123!

> ⚠️ **Important**: Change the default admin password immediately after first login in production.

## API Integration

The admin panel connects to the Handwork backend API. Ensure the backend is running and the `NEXT_PUBLIC_API_URL` is correctly configured.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Copyright © 2024 Handwork. All rights reserved.
