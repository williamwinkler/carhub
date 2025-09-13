# Frontend Development Guidelines

This file provides specific guidance for working with the Next.js frontend in this project.

## Technology Stack

### Core Technologies
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **tRPC** for type-safe API communication
- **TanStack Query** for server state management
- **TailwindCSS** for styling

## Development Standards

### Data Fetching & State Management
- **Server State**: Use tRPC with TanStack Query for all API calls
- **Client State**: Use React state hooks for UI state only
- **Caching**: Leverage TanStack Query's built-in caching
- **Optimistic Updates**: Implement where appropriate for better UX

### Component Architecture
```typescript
// Prefer composition and reusability
interface ComponentProps {
  // Use proper TypeScript interfaces
}

export function Component({ ...props }: ComponentProps) {
  // Component implementation
}
```

### tRPC Client Usage
```typescript
// Use the tRPC hooks for data fetching
const { data, isLoading, error } = api.cars.getAll.useQuery();

// For mutations
const createCar = api.cars.create.useMutation({
  onSuccess: () => {
    // Invalidate and refetch
    utils.cars.getAll.invalidate();
  }
});
```

### Styling Guidelines
- **Primary**: Use TailwindCSS utility classes
- **Avoid**: Inline styles and CSS modules
- **Components**: Create reusable styled components when needed
- **Responsive**: Mobile-first design approach
- **Dark Mode**: Support system theme preferences

### Performance Best Practices
- **Loading States**: Always provide loading indicators
- **Error Boundaries**: Implement proper error handling
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js `Image` component
- **Bundle Analysis**: Monitor bundle size regularly

## File Organization

### App Router Structure
```
src/app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── (routes)/               # Route groups
│   ├── cars/
│   │   ├── page.tsx        # Cars list page
│   │   └── [id]/
│   │       └── page.tsx    # Car detail page
├── _components/            # Reusable components
│   ├── ui/                 # Base UI components
│   └── features/           # Feature-specific components
└── _trpc/                  # tRPC client setup
    ├── client.ts
    ├── provider.tsx
    └── server.ts
```

### Component Patterns
- **Page Components**: Handle routing and data fetching
- **Feature Components**: Business logic and UI for specific features
- **UI Components**: Reusable, generic UI elements
- **Layout Components**: Page structure and navigation

## tRPC Integration

### Client Setup
The tRPC client is configured in `_trpc/client.ts` with:
- Type-safe API calls
- Automatic request/response serialization
- Built-in error handling
- TanStack Query integration

### Usage Patterns
```typescript
// Query data
const carsQuery = api.cars.getAll.useQuery();

// Mutate data
const createCarMutation = api.cars.create.useMutation();

// Optimistic updates
const utils = api.useUtils();
await utils.cars.getAll.invalidate();
```

### Error Handling
```typescript
const { data, error, isLoading } = api.cars.getAll.useQuery();

if (error) {
  // Handle tRPC errors
  console.error('API Error:', error.message);
}
```

## Development Workflow

### Adding New Features
1. Check if tRPC procedures exist in API
2. Create page/component structure
3. Implement data fetching with tRPC hooks
4. Add loading states and error handling
5. Style with TailwindCSS
6. Test user interactions and edge cases

### Component Development
1. Define TypeScript interfaces for props
2. Use proper React patterns (hooks, composition)
3. Implement responsive design
4. Add loading and error states
5. Ensure accessibility (ARIA labels, keyboard navigation)

### Code Quality
- Use TypeScript strict mode
- Follow React best practices
- Implement proper error boundaries
- Write meaningful component and function names
- Keep components focused and single-purpose

## Common Patterns

### Loading States
```typescript
if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
```

### Form Handling
```typescript
const form = useForm<FormData>({
  // Form configuration
});

const mutation = api.cars.create.useMutation({
  onSuccess: () => router.push('/cars'),
  onError: (error) => setError(error.message)
});
```

### Navigation
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/cars');
```

## Performance Monitoring
- Use React DevTools for component analysis
- Monitor Core Web Vitals
- Analyze bundle size with `@next/bundle-analyzer`
- Profile slow components and optimizations