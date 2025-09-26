# Frontend Development Guidelines

This file provides specific guidance for working with the Next.js frontend in this project, based on Next.js 15 best practices for 2024.

## Technology Stack

### Core Technologies
- **Next.js 15+** with App Router
- **TypeScript** for type safety
- **tRPC** for type-safe API communication
- **TanStack Query** for server state management
- **TailwindCSS** for styling
- **React Icons** for consistent iconography

## Next.js 15 Best Practices (2024)

### Server vs Client Components
- **Default to Server Components** for performance - only use "use client" when necessary
- **Client Components needed for**: event handlers, hooks, browser-only APIs, state management
- **Server Components for**: data fetching, static content, SEO optimization

### SEO and Performance
- **Metadata API**: Use the new metadata API for SEO optimization
- **Font Optimization**: Use `next/font` with `display: 'swap'` for better performance
- **Image Optimization**: Always use `next/image` component
- **Loading Patterns**: Implement proper loading UI and Suspense boundaries

## File Organization & Folder Structure

### Recommended Project Structure
```
src/
├── app/                    # App Router (Next.js 15)
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Homepage
│   ├── (auth)/            # Route groups - organize without affecting URLs
│   │   ├── login/
│   │   └── register/
│   ├── cars/              # Feature routes
│   │   ├── page.tsx       # Cars list
│   │   └── [id]/
│   │       └── page.tsx   # Car details
│   ├── _components/       # Private folder - not routed
│   │   ├── ui/            # Basic UI building blocks
│   │   ├── features/      # Business logic components
│   │   └── layout/        # Layout-specific components
│   └── api/               # API routes
├── lib/                   # Utility functions & configurations
│   ├── auth-context.tsx   # Auth context provider
│   ├── cookies.ts         # Cookie utilities
│   └── utils.ts           # General utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── styles/                # Global styles
```

### Component Organization Best Practices
- **UI Folder**: Basic building blocks (buttons, inputs, cards) - not tied to business logic
- **Features Folder**: Components tied to specific business domains
- **Layout Folder**: Structural components used across multiple pages
- **Co-location**: Keep feature-specific components close to where they're used
- **No 250+ Line Components**: Break large components into smaller, focused pieces

### Naming Conventions
- **Route Groups**: Use `(folderName)` for organization without affecting URLs
- **Private Folders**: Use `_folderName` to exclude from routing
- **Component Files**: Use PascalCase for component files
- **Utility Files**: Use kebab-case for utility files

## Component Architecture

### Component Design Principles
```typescript
// Keep components focused and under 250 lines
interface ComponentProps {
  // Use proper TypeScript interfaces
  // Keep prop count manageable
}

export default function Component({ ...props }: ComponentProps) {
  // Single responsibility principle
  // Compose larger functionality from smaller pieces
}
```

### Component Composition Patterns
```typescript
// Prefer composition over large monolithic components
<CarPage>
  <CarFilters onFilter={handleFilter} />
  <CarGrid cars={cars} isLoading={loading} />
  <Pagination currentPage={page} onPageChange={setPage} />
</CarPage>
```

## Data Fetching & State Management

### tRPC Best Practices
```typescript
// Server State: Use tRPC with TanStack Query
const { data, isLoading, error } = trpc.cars.list.useQuery();

// Client State: Use React state hooks for UI only
const [isOpen, setIsOpen] = useState(false);

// Optimistic Updates
const utils = trpc.useUtils();
const mutation = trpc.cars.create.useMutation({
  onSuccess: () => utils.cars.list.invalidate()
});
```

### Performance Patterns
- **Caching**: Leverage TanStack Query's built-in caching
- **Invalidation**: Use precise cache invalidation
- **Loading States**: Always provide loading indicators
- **Error Boundaries**: Implement proper error handling

## Styling Guidelines

### TailwindCSS Best Practices
- **Utility-First**: Primary approach with TailwindCSS
- **Component Classes**: Extract repeated patterns into components
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: System theme support
- **Avoid**: Inline styles and CSS modules

### Design System
```typescript
// Create consistent design tokens
const styles = {
  card: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg",
  button: "px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600",
  text: {
    heading: "text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent",
    body: "text-slate-400"
  }
};
```

## Development Workflow

### Adding New Features
1. **Planning**: Identify if feature needs Server or Client components
2. **Structure**: Create component hierarchy (keep under 250 lines each)
3. **Data Layer**: Set up tRPC queries/mutations
4. **UI Layer**: Build with proper loading states
5. **Testing**: Test interactions and edge cases
6. **Performance**: Check bundle size and Core Web Vitals

### Component Development Checklist
- [ ] TypeScript interfaces defined
- [ ] Server/Client component choice justified
- [ ] Component under 250 lines
- [ ] Loading and error states handled
- [ ] Responsive design implemented
- [ ] Accessibility considerations (ARIA, keyboard nav)
- [ ] Proper error boundaries

## Code Quality Standards

### Anti-Patterns to Avoid
- **Utils Black Hole**: Don't put everything in one `utils.ts` file
- **Deep Nesting**: Avoid paths like `components/features/dashboard/widgets/weather/current/small/`
- **Monolithic Components**: Keep components focused and small
- **Missing Loading States**: Always handle loading and error states
- **Client Components by Default**: Use Server Components unless client features needed

### Consistency Rules
- **Folder Structure**: Maintain consistent organization throughout
- **Component Patterns**: Use established patterns for similar functionality
- **State Management**: Keep client state minimal, use server state for data
- **Error Handling**: Consistent error patterns across components

## Performance Monitoring

### Core Metrics to Track
- **Bundle Size**: Monitor with `@next/bundle-analyzer`
- **Core Web Vitals**: LCP, FID, CLS
- **React DevTools**: Component render performance
- **Network**: API call efficiency

### Optimization Strategies
- **Code Splitting**: Dynamic imports for large features
- **Image Optimization**: Always use `next/image`
- **Font Loading**: Use `next/font` with proper display strategies
- **Caching**: Leverage Next.js and TanStack Query caching

## Project Evolution Guidelines

### Refactoring Strategy
- **Monitor Component Size**: Refactor when approaching 250 lines
- **Feature Growth**: Reorganize folder structure as features grow
- **Performance Reviews**: Regular bundle size and performance audits
- **Documentation**: Keep this file updated with new patterns and decisions

### Scaling Considerations
- **Feature-Based Organization**: Group by business domain, not file type
- **Shared Components**: Extract to `ui/` when used across features
- **API Organization**: Mirror backend tRPC structure in frontend
- **Type Safety**: Maintain end-to-end type safety with tRPC