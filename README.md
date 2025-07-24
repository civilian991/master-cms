# Master CMS Framework

An AI-powered content management system framework designed for multi-site media companies. Built with Next.js 15, TypeScript, Prisma, and Tailwind CSS.

## 🚀 Features

- **Multi-Site Support**: Deploy the same framework across multiple media companies with isolated data and branding
- **AI Integration**: Built-in AI-powered content generation, optimization, and automation
- **Multilingual**: Full support for English and Arabic with RTL layout
- **Modern Stack**: Next.js 15, React 19, TypeScript, Prisma, Tailwind CSS 4
- **Role-Based Access**: Comprehensive user management with role-based permissions
- **Content Management**: Articles, categories, tags, media, and newsletters
- **Performance**: Optimized for sub-2 second load times
- **Scalable**: Designed to handle 1M+ monthly visitors

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd master-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/master_cms"
   
   # Site Configuration
   SITE_ID="master"
   SITE_NAME="Master CMS Framework"
   SITE_URL="http://localhost:3000"
   SITE_LOCALE="en"
   SITE_THEME="default"
   SITE_BRANDING="default"
   
   # NextAuth Configuration
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with initial data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
master-cms/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── ui/               # Reusable UI components
│   │   └── site/             # Site-specific components
│   ├── config/               # Configuration files
│   │   └── site.ts           # Site configuration system
│   ├── lib/                  # Utility libraries
│   │   ├── db.ts            # Database connection
│   │   └── utils.ts         # Utility functions
│   └── generated/            # Generated Prisma client
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding
├── deployments/             # Site-specific deployments
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 🗄️ Database Schema

The framework includes a comprehensive database schema with:

- **Site**: Multi-site configuration and isolation
- **User**: Authentication and role-based access control
- **Article**: Multilingual content management
- **Category**: Hierarchical content organization
- **Tag**: Content tagging and classification
- **Media**: File management and optimization
- **Newsletter**: Email campaign management
- **SecurityEvent**: Audit logging and security tracking
- **SiteSetting**: Site-specific configuration storage

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

## 🧪 Testing

The framework includes comprehensive testing setup:

- **Unit Tests**: Jest and React Testing Library
- **Component Tests**: UI component testing
- **Configuration Tests**: Site configuration validation
- **Database Tests**: Prisma integration testing

Run tests:
```bash
npm run test
```

## 🌐 Multi-Site Deployment

The framework is designed for multi-site deployment:

1. **Clone the master framework** for each site
2. **Configure environment variables** for site-specific settings
3. **Customize branding and theme** through configuration
4. **Deploy with isolated databases** for data separation

### Site Configuration

Each site can be configured through environment variables:

```env
SITE_ID="site-1"
SITE_NAME="Media Company 1"
SITE_URL="https://site1.com"
SITE_LOCALE="en"
SITE_THEME="custom-theme"
SITE_BRANDING="custom-branding"
```

## 🔐 Authentication & Authorization

- **NextAuth.js**: JWT-based authentication
- **Role-Based Access**: ADMIN, EDITOR, PUBLISHER, USER roles
- **Site Isolation**: Users are isolated per site
- **Security Events**: Comprehensive audit logging

## 🎨 Theming & Branding

- **Dynamic Themes**: Configurable themes per site
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **RTL Support**: Full Arabic language support

## 📊 Performance

- **Next.js 15**: Latest performance optimizations
- **App Router**: Modern React patterns
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic code splitting
- **Caching**: Intelligent caching strategies

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```bash
# Build Docker image
docker build -t master-cms .

# Run container
docker run -p 3000:3000 master-cms
```

### Manual Deployment

1. Build the application: `npm run build`
2. Start production server: `npm run start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation in `/docs`
- Review the troubleshooting guide

## 🔮 Roadmap

- [ ] Advanced AI features
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Advanced security features

---

**Built with ❤️ for modern media companies**
