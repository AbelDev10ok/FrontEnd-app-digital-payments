# AGENTS.md - FrontEnd-app-digital-payments

## Build, Lint, and Test Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint on all files
- ESLint can be run on specific files/directories: `npx eslint src/components/Button.tsx`

### Type Checking
- TypeScript checking is handled by IDE and build process
- No separate type-check command in package.json

### Testing
> Note: No testing framework appears to be configured in this repository.
> To add testing capabilities, consider installing Vitest or Jest with React Testing Library.

## Code Style Guidelines

### Imports
1. **Order**:
   - React imports first
   - Then third-party libraries (alphabetical)
   - Then internal imports (absolute paths preferred)
   - Then relative imports

2. **Path Preferences**:
   - Use absolute paths with `@/` alias when available (configured in tsconfig.json)
   - Prefer named exports over default exports when importing multiple items from same file
   - Group imports from same module together

Example:
```typescript
// Good
import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/authStore';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { Sale } from '@/types/sales';

// Also good for multiple items from same module
import { Button, Input, Modal } from '@/shared/components/ui';
```

### Formatting
- Follow Prettier standards (though not explicitly configured, code appears to follow common TS/React conventions)
- Max line length: 100 characters
- Use 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multi-line objects/arrays

### Types and Interfaces
- Use interfaces for object shapes that may be extended
- Use type aliases for complex types, unions, intersections
- Always type props in React components
- Avoid `any` type; use `unknown` when type is truly unknown and narrow it
- Define types in `/types` directory or alongside components if component-specific

Example:
```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'ROLE_ADMIN' | 'ROLE_USER';

interface Props {
  user: User;
  onLogout: () => void;
  role?: UserRole;
}
```

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Functions and variables**: camelCase (e.g., `const getUserData = () => {}`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `const API_BASE_URL = '/api'`)
- **Files**: 
  - Components: PascalCase (e.g., `SaleForm.tsx`)
  - Hooks: camelCase with `use` prefix (e.g., `useSales.ts`)
  - Utils: camelCase (e.g., `formatCurrency.ts`)
  - Types: PascalCase (e.g., `sales.ts`)
- **CSS classes**: kebab-case (following Tailwind conventions)

### Error Handling
- Use try/catch for asynchronous operations
- Handle promise rejections appropriately
- Display user-friendly error messages using shared components
- Log errors to console in development only
- Create custom error types when needed for specific error handling

Example:
```typescript
try {
  const data = await api.fetchSales();
  setSales(data);
} catch (error) {
  if (error instanceof Error) {
    toast.error(`Failed to load sales: ${error.message}`);
  } else {
    toast.error('An unexpected error occurred');
  }
  console.error('Fetch sales error:', error);
}
```

### React Specific Guidelines
- Use functional components with hooks
- Keep components small and focused
- Extract complex logic to custom hooks
- Use React.memo() only when performance testing shows benefit
- Follow hooks rules: only call hooks at top level, only in React functions
- Use appropriate dependency arrays in useEffect, useCallback, useMemo
- Clean up subscriptions and timers in useEffect return functions

Example:
```typescript
import { useEffect, useState } from 'react';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await api.getSales();
        if (!cancelled) {
          setSales(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch sales:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchSales();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  return { sales, loading };
}
```

### State Management
- Use Zustand (already configured in authStore) for global state
- Keep component state local when it doesn't need to be shared
- Derive state when possible instead of duplicating in state
- Update state immutably

Example:
```typescript
// Good - deriving state
const completedSales = sales.filter(sale => sale.completed);
const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.priceTotal, 0);

// Avoid duplicating state that can be derived
// DON'T: store both sales and completedSales separately when completedSales can be derived
```

### File Organization
- Group related files by feature/domain (already partially implemented)
- Each feature gets its own folder under `/features`
- Shared components, hooks, utils go under `/shared`
- Types go in `/types` directory
- Keep index.ts files for barrel exports when beneficial

### Accessibility
- Use semantic HTML elements
- Provide meaningful alt text for images
- Ensure proper color contrast (Tailwind classes help)
- Implement keyboard navigation where appropriate
- Use ARIA attributes when needed

### Performance
- Lazy load routes and heavy components
- Use useMemo and useCallback appropriately
- Avoid inline object/function creation in renders when possible
- Optimize images and assets

Example:
```typescript
// Good - memoizing expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// Good - preventing function re-creation
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

## Additional Notes

### Current Architecture Observations
- Uses Vite as build tool
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management (auth)
- React Router v7 for routing
- Features organized by domain (auth, clients, ventas, etc.)

### Recommended Improvements
1. Add testing framework (Vitest + React Testing Library)
2. Configure Prettier for consistent formatting
3. Add commit linting and formatting hooks
4. Consider implementing error boundaries
5. Add loading states and skeleton UIs for better UX

This AGENTS.md file should provide clear guidelines for agents working in this repository.