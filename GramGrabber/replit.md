# Instagram Profile Downloader

## Overview

A full-stack web application built with React and Express that allows users to download Instagram profile content in bulk. The application provides a secure, password-protected interface for scraping Instagram profiles and downloading their media content (images, videos, and stories) as organized zip archives.

The system uses a modern tech stack with TypeScript, React with shadcn/ui components, Express.js backend, PostgreSQL database with Drizzle ORM, and integrates with Instagram's API for content scraping.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture  
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON responses
- **Middleware**: Custom authentication middleware for password-based session management
- **File Processing**: Archiver library for creating zip files from downloaded media
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Hot module replacement with Vite integration for development server

### Database Layer
- **Database**: PostgreSQL configured through Drizzle Kit
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL connection
- **Schema Management**: Database migrations handled through Drizzle Kit
- **Storage Strategy**: Hybrid approach using both PostgreSQL for metadata and in-memory storage for temporary session data

### Authentication & Security
- **Authentication**: Simple password-based authentication system with hardcoded access code
- **Session Management**: Bearer token authentication using base64 encoded credentials
- **Authorization**: Middleware-based route protection requiring valid authentication tokens
- **Security Headers**: Standard Express security practices with JSON parsing limits

### External Integrations
- **Instagram Scraping**: Custom Instagram scraper service using instagram-private-api
- **Media Processing**: Automated media download and organization by content type
- **File Management**: Temporary file storage with automatic cleanup after 24 hours
- **Archive Creation**: Zip file generation with organized folder structure for different media types

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack Query
- **Build Tools**: Vite with TypeScript support, PostCSS, Autoprefixer
- **Backend**: Express.js, Node.js with ESM modules

### UI and Styling
- **Component Library**: Radix UI primitives (@radix-ui/react-*)
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Icons**: Lucide React icon library
- **Utilities**: clsx and tailwind-merge for conditional styling

### Database and ORM
- **Database**: Neon Database serverless PostgreSQL
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Validation**: Zod for runtime type checking and validation

### External Services
- **Instagram API**: instagram-private-api for content scraping
- **File Processing**: Archiver for zip file creation
- **HTTP Client**: Axios for external API requests

### Development Tools
- **Replit Integration**: @replit/vite-plugin-* for development environment
- **Type Safety**: Full TypeScript support across frontend and backend
- **Hot Reload**: Vite HMR for rapid development feedback