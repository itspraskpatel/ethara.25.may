# Collabo - Collaborative Drawing Board Application

## Project Overview

It is a modern, full-stack collaborative drawing board application with a Modern Look built with Next.js that enables real-time drawing and collaboration. The application features an infinite drawing board with multiple drawing tools(like square,circle etc.), allowing users to create and share interactive whiteboard experiences. Users can enter their display name upon landing and optionally provide an email for enhanced features. The platform uses browser-based user identification combined with IP tracking for security and user management.

The application is designed to handle a large user base (~100 concurrent users) with high performance optimization(which can scale). Real-time collaboration is powered by Industry tested Socket.io, enabling multiple users to work simultaneously on the same board. The left sidebar provides a solid comprehensive UI for color selection, marker thickness adjustment, shape types (solid/wireframe), and opacity control. Users can easily share boards via embedded links so the interactions among become simpler, and it also displays active user count for transparency and usability. It also features a responsive design that works flawlessly across desktop, tablet, and mobile phones, with smooth animations and micro-interactions throughout the UI/UX. Backend security is enforced through rate limiting users to prevent DDoS attacks, and structured error handling with hourly changing log file rotation.

## Repository Structure

```
chatGPTCode/
├── prompt.md                          # Project requirements and specifications
├── README.md                           # Project documentation
│
├── chatGPTCode/                        # Main Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                   # API routes
│   │   │   │   ├── ai/                # AI endpoints
│   │   │   │   ├── auth/              # Authentication routes
│   │   │   │   ├── health/            # Health check
│   │   │   │   ├── members/           # Member management
│   │   │   │   ├── projects/          # Project endpoints
│   │   │   │   ├── tasks/             # Task management
│   │   │   │   ├── users/             # User endpoints
│   │   │   │   └── whiteboard/        # Whiteboard endpoints
│   │   │   ├── board/[boardId]/       # Dynamic board page
│   │   │   ├── dashboard/             # Dashboard pages
│   │   │   ├── login/                 # Login page
│   │   │   ├── signup/                # Signup page
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── page.tsx               # Home page
│   │   │   └── globals.css            # Global styles
│   │   ├── components/
│   │   │   ├── dashboard/             # Dashboard components
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── tasks/                 # Task components
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   └── TaskCard.tsx
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   ├── providers/             # React providers
│   │   │   │   └── SessionProvider.tsx
│   │   ├── features/
│   │   │   └── whiteboard/            # Whiteboard feature module
│   │   │       ├── schema.ts          # Data schema
│   │   │       ├── types.ts           # TypeScript types
│   │   │       ├── components/        # Feature-specific components
│   │   │       ├── hooks/             # Custom hooks
│   │   │       └── utils/             # Utility functions
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── lib/
│   │   │   ├── server/                # Server utilities
│   │   │   │   ├── api-response.ts
│   │   │   │   ├── ip.ts
│   │   │   │   ├── logger.ts
│   │   │   │   └── rate-limit.ts
│   │   │   └── db/
│   │   │       ├── client/            # Database client
│   │   │       │   └── prismaClient.ts
│   │   │       └── generated/         # Generated Prisma types
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema
│   │   └── migrations/                # Database migrations
│   ├── public/                        # Static assets
│   ├── package.json                   # NPM dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── next.config.ts                 # Next.js configuration
│   ├── tailwind.config.mjs            # Tailwind CSS configuration
│   ├── postcss.config.mjs             # PostCSS configuration
│   ├── eslint.config.mjs              # ESLint configuration
│   ├── server.mjs                     # Custom server setup
│   ├── prisma.config.ts               # Prisma configuration
│   ├── LOG/                           # Application logs
│   └── README.md
│
└── geminiCode/                        # Alternative implementation
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   └── users/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── globals.css
    │   └── components/
    │       ├── CanvasBoard.tsx
    │       ├── LandingModal.tsx
    │       ├── SidePanel.tsx
    │       └── Toolbar.tsx
    ├── prisma/
    │   └── schema.prisma
    ├── package.json
    ├── tsconfig.json
    └── server.js
```
## Instructions for running/testing the code

Just go to the desired project folder(chatGPTCode, geminiCode, goldenResponse) same instructions for all

Step 1: npm i
Step 2: add database url to .env
Step 3: npx prisma generate
Step 4: npx prisma db push
Step 5: npm run dev