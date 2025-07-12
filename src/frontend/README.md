> [!NOTE]
> Para leer este documento en español, visita este [archivo](README_ES.md)

# Frontend
The Lactokeeper web interface is built with **Next.js** and **React**, delivering a modern, responsive, and optimized experience for dairy farm management. The frontend enables visualization and management of users, farms, IoT devices, notifications, and key sector data, integrating secure authentication and PWA features.

## Technology Stack

The frontend uses a current and efficient stack for enterprise web applications:

- **Main framework**: Next.js + React 18
- **Styling**: Tailwind CSS + custom CSS
- **UI Components**: Radix UI, Lucide React, Framer Motion
- **State management**: Zustand, React Context
- **Authentication**: NextAuth.js
- **Form validation**: React Hook Form + Zod
- **Testing**: Jest + Testing Library
- **PWA**: Progressive Web App configuration and support
- **Deployment**: Docker

## Project Structure

The frontend is organized in a modular and scalable way:

```
├── app/                # Next.js routes and pages (includes login, error, not-found, layout)
├── components/         # Reusable components (UI, layout, forms, tables, modals, charts)
├── constants/          # Static configuration (navigation, colors, data)
├── hooks/              # Custom hooks for business logic and context
├── lib/                # Utilities and helpers
├── providers/          # Global context providers (e.g. session)
├── public/             # Static assets (images, icons, fonts, manifest)
├── services/           # API and data access logic
├── tests/              # Unit and integration tests
├── types/              # TypeScript types and models
├── middleware.ts       # Authentication and access control middleware
├── next.config.mjs     # Next.js configuration
├── Dockerfile          # Container deployment configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Installation & Setup

### System Prerequisites

- Node.js v18 or higher
- Access to required environment variables (see `.env.local`)
- Backend and databases running for integration

### Installation Process

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env.local` (see example in `.env.docker`).
3. For development, run:
   ```bash
   npm run dev
   ```

## Available Scripts

- `dev`: Starts Next.js development server
- `build`: Builds the app for production
- `start`: Starts the server in production mode
- `lint`: Runs ESLint
- `test`: Runs unit tests
- `test:coverage`: Shows test coverage report
- `generate-icons`: Generates PWA icons

## Security & Authentication

Route access is protected by middleware and NextAuth.js, supporting differentiated roles (Administrator, Farmer, Veterinarian, Industry). The middleware controls access and redirects based on permissions and authentication.

## PWA & Mobile Experience

The app is optimized as a PWA, allowing installation on mobile devices and limited offline access. It includes manifest, adaptive icons, and configuration for web-app on iOS and Android.

## Testing

Tests are located in the `tests/` folder and use Jest with Testing Library to ensure component and business logic quality.

## Deployment

Deployment is done via Docker, following best practices for production and CI/CD.
