---
name: Web App Code Quality Improvements
overview: Comprehensive code quality analysis identifying code smells, type safety issues, performance optimizations, accessibility improvements, and architectural refactoring opportunities across the Next.js web application.
todos:
  - id: fix-dynamic-tailwind-classes
    content: Fix dynamic Tailwind class generation in CarCard.tsx and CarDetailClient.tsx - use proper class mapping instead of template literals
    status: pending
  - id: extract-login-hook
    content: Extract duplicate login logic from Navbar.tsx and Login.tsx into shared useLogin hook
    status: pending
  - id: fix-profileform-types
    content: Replace duplicate User interface in ProfileForm.tsx with shared type from _trpc/types.ts
    status: pending
  - id: create-constants-file
    content: Create constants/index.ts file for API URLs, pagination limits, and other magic numbers
    status: pending
  - id: refactor-apikeymanager-modal
    content: Replace inline modal code in ApiKeyManager.tsx with reusable Modal component
    status: pending
  - id: split-navbar-component
    content: Split Navbar.tsx into smaller components (LoginForm, UserMenu, NavigationLinks)
    status: pending
  - id: add-error-boundaries
    content: Add ErrorBoundary component and wrap key sections for graceful error handling
    status: pending
  - id: improve-accessibility
    content: Add ARIA labels, keyboard navigation, and focus management to interactive elements
    status: pending
  - id: standardize-error-handling
    content: Create error handling utilities and replace console.error with proper error logging
    status: pending
  - id: add-performance-optimizations
    content: Add React.memo to CarCard, CarGrid, and optimize with useCallback/useMemo where needed
    status: pending
  - id: reduce-car-filters-props
    content: Refactor CarFilters to use single config object instead of 9 individual props
    status: pending
  - id: fix-hardcoded-urls
    content: Replace hardcoded API URLs with environment variables and constants
    status: pending
---

# Web App Code Quality Analysis & Improvement Plan

## Critical Issues

### 1. Type Safety Violations

- **ProfileForm.tsx**: Defines duplicate `User` interface instead of using shared type from `_trpc/types.ts`
- **Error Handling**: Inconsistent type guards - using type assertions instead of proper validation
- **Location**: `apps/web/src/app/_components/account/ProfileForm.tsx:8-14`

### 2. Code Duplication

- **Login Logic**: Duplicated in `Navbar.tsx` and `Login.tsx` - should extract to shared hook
- **Modal Implementation**: `ApiKeyManager.tsx` has inline modal code instead of using `Modal` component
- **Error Handling Patterns**: Repeated error handling logic across components

### 3. Component Complexity

- **Navbar.tsx**: 314 lines - exceeds 250 line guideline, should be split into smaller components
- **HomePage.tsx**: Large inline JSX blocks that could be extracted to sub-components
- **CarCard.tsx**: Complex favorite toggle logic mixed with presentation

### 4. Performance Issues

- **Missing Memoization**: `CarCard`, `CarGrid`, `CarFilters` could benefit from `React.memo`
- **Missing useCallback**: Event handlers in `CarsPageContent` are wrapped but could be optimized further
- **Unnecessary Re-renders**: Some components re-render when parent state changes unnecessarily

### 5. Dynamic Tailwind Classes Bug

- **CarCard.tsx:149**: Dynamic class name `text-${car.color.toLowerCase()}-400` won't work - Tailwind requires full class names
- **CarDetailClient.tsx:156**: Same issue with dynamic color classes
- **Impact**: Classes won't be included in production build

### 6. Accessibility Issues

- Missing ARIA labels on interactive elements (buttons, form inputs)
- Missing keyboard navigation hints
- Modal focus management not implemented
- Missing skip links for navigation

### 7. Code Organization

- **Hardcoded Values**: API URLs, magic numbers scattered throughout
- **Missing Constants File**: Should extract constants like `LIMIT = 12`, API URLs, etc.
- **Utils Black Hole**: `utils.ts` only has `sleep` function - could be better organized

### 8. Error Handling Inconsistencies

- Some errors use `console.error` (auth-context.tsx:85, refresh-token-link.ts:89)
- Inconsistent error message formatting
- Missing error boundaries for component-level error handling
- Some async operations lack proper error handling

### 9. Security Concerns

- Hardcoded API URL in `ApiKeyManager.tsx:109` (`http://localhost:3001/docs`)
- Missing input sanitization in some form fields
- Cookie configuration could be more secure

### 10. Best Practices Violations

- **Server vs Client Components**: Some components marked "use client" could be server components
- **Missing Loading States**: Some async operations don't show loading indicators
- **Inconsistent Hook Usage**: Mix of `trpc.useContext()` and `trpc.useUtils()` - should standardize

## Improvement Opportunities

### 11. Missing Features

- No error boundaries for graceful error handling
- No loading skeletons for better UX
- Missing form validation feedback in some forms
- No optimistic updates for some mutations

### 12. Code Smells

- **Long Parameter Lists**: `CarFilters` component has 9 props - consider using a single config object
- **Primitive Obsession**: Using strings for sortBy/sortDirection - should use enums or constants
- **Feature Envy**: Components accessing too much data from parent
- **Dead Code**: `useAuthErrorHandler` hook exists but appears unused

### 13. Testing & Documentation

- No visible test files
- Missing JSDoc comments for complex functions
- No TypeScript strict mode enforcement visible

## Recommended Refactoring Priority

### High Priority

1. Fix dynamic Tailwind class bug (CarCard, CarDetailClient)
2. Extract login logic to shared hook
3. Replace duplicate User interface in ProfileForm
4. Extract constants to dedicated file
5. Add error boundaries

### Medium Priority

6. Split Navbar into smaller components
7. Extract modal code in ApiKeyManager to use Modal component
8. Add React.memo to expensive components
9. Improve accessibility (ARIA labels, keyboard nav)
10. Standardize error handling patterns

### Low Priority

11. Extract inline JSX to sub-components
12. Add loading skeletons
13. Optimize with useMemo where needed
14. Add JSDoc comments
15. Review and remove unused code

## Files Requiring Changes

**High Priority:**

- `apps/web/src/app/_components/cars/CarCard.tsx` - Fix dynamic classes, extract logic
- `apps/web/src/app/cars/[id]/CarDetailClient.tsx` - Fix dynamic classes
- `apps/web/src/app/_components/account/ProfileForm.tsx` - Use shared User type
- `apps/web/src/app/_components/Navbar.tsx` - Extract login logic, split component
- `apps/web/src/app/_components/account/ApiKeyManager.tsx` - Use Modal component

**Medium Priority:**

- `apps/web/src/app/_components/Login.tsx` - Extract to shared hook
- `apps/web/src/lib/auth-context.tsx` - Improve error handling
- `apps/web/src/app/_components/cars/CarFilters.tsx` - Reduce prop count
- `apps/web/src/app/cars/page.tsx` - Performance optimizations

**New Files Needed:**

- `apps/web/src/constants/index.ts` - Centralized constants
- `apps/web/src/hooks/useLogin.ts` - Shared login logic
- `apps/web/src/components/ErrorBoundary.tsx` - Error boundary component
- `apps/web/src/utils/error-handling.ts` - Standardized error utilities