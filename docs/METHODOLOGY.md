# Development Methodology
## ProdAI - How We Build

**Version:** 1.0  
**Last Updated:** December 30, 2024  

---

## Development Philosophy

### The ProdAI Way

We follow a **pragmatic agile** approach that prioritizes:
1. Working software over perfect code
2. User feedback over internal assumptions
3. Iteration over big-bang releases
4. Simplicity over complexity

---

## Code Organization

### Feature-First Architecture

```
src/features/
├── featureName/
│   ├── components/      # UI components
│   ├── hooks/           # Feature-specific hooks
│   ├── featureSlice.js  # Redux state
│   ├── selectors.js     # Memoized queries
│   └── index.js         # Public exports
```

**Why Feature-First?**
- ✅ Related code stays together
- ✅ Easy to understand scope
- ✅ Simple to add/remove features
- ✅ Clear ownership boundaries

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.jsx` |
| Hooks | camelCase, `use` prefix | `useOnClickOutside.js` |
| Slices | camelCase, `Slice` suffix | `tasksSlice.js` |
| Selectors | camelCase, `select` prefix | `selectAllTasks` |
| Utils | camelCase | `formatDate.js` |
| Constants | SCREAMING_SNAKE | `MAX_TASKS` |

---

## Component Guidelines

### Component Structure

```jsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// 2. Component
const ComponentName = ({ prop1, prop2 }) => {
    // 2a. Hooks
    const dispatch = useDispatch();
    const [state, setState] = useState(null);
    
    // 2b. Derived state
    const computedValue = useMemo(() => ..., [deps]);
    
    // 2c. Effects
    useEffect(() => { ... }, [deps]);
    
    // 2d. Handlers
    const handleClick = () => { ... };
    
    // 2e. Render
    return (
        <div>...</div>
    );
};

// 3. Export
export default ComponentName;
```

### Component Principles

1. **Single Responsibility**: One component, one purpose
2. **Props Down, Events Up**: Data flows down, actions bubble up
3. **Composition**: Prefer small, composable components
4. **Colocation**: Keep tests and styles near components

---

## State Management

### Redux Toolkit Patterns

**Slice Template:**
```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    loading: false,
    error: null
};

const featureSlice = createSlice({
    name: 'feature',
    initialState,
    reducers: {
        actionName: (state, action) => {
            // Immer allows "mutation"
            state.items.push(action.payload);
        }
    }
});

export const { actionName } = featureSlice.actions;
export default featureSlice.reducer;
```

**Selector Template:**
```javascript
import { createSelector } from '@reduxjs/toolkit';

const selectFeature = state => state.feature;

export const selectItems = createSelector(
    [selectFeature],
    (feature) => feature.items
);

export const selectFilteredItems = createSelector(
    [selectItems, (_, filter) => filter],
    (items, filter) => items.filter(item => item.type === filter)
);
```

### State Decision Tree

```
Is the state...
├── Shared across components? → Redux
├── Used only in one component? → useState
├── Complex with transitions? → useReducer
├── From server/async? → Redux with thunks
└── Derived from other state? → useMemo/selector
```

---

## Styling Approach

### CSS Custom Properties (Design Tokens)

```css
:root {
    /* Colors */
    --primary: #8b5cf6;
    --surface-primary: rgba(17, 17, 17, 0.95);
    
    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    
    /* Typography */
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    
    /* Borders */
    --radius-sm: 8px;
    --radius-md: 12px;
}
```

### Styling Rules

1. **Use CSS Variables**: For all colors, spacing, radii
2. **Inline Styles**: Only for truly dynamic values
3. **Class Names**: For reusable patterns (`.glass-panel`, `.btn-primary`)
4. **No CSS-in-JS**: Keep styles in CSS files

---

## Git Workflow

### Branch Strategy

```
main
├── feature/task-filtering      # New features
├── fix/quick-add-close         # Bug fixes
├── refactor/state-management   # Code improvements
└── docs/update-readme          # Documentation
```

### Commit Messages

```
type(scope): brief description

- Bullet points for details
- Keep under 72 characters per line

Types: feat, fix, refactor, docs, style, test, chore
```

**Examples:**
```
feat(tasks): add priority filter to task list
fix(quick-add): prevent accordion closing on suggestion click
refactor(user): migrate to Redux Toolkit
docs(readme): update installation instructions
```

---

## Testing Strategy

### Test Pyramid

```
         ┌───────────┐
         │   E2E     │  ← Few, slow, high confidence
         ├───────────┤
         │Integration│  ← Some, moderate speed
         ├───────────┤
         │   Unit    │  ← Many, fast, focused
         └───────────┘
```

### What to Test

| Type | What | How |
|------|------|-----|
| Unit | Utilities, reducers, selectors | Jest |
| Integration | Component interactions | React Testing Library |
| E2E | Critical user flows | Playwright (future) |

### Testing Principles

1. **Test Behavior, Not Implementation**
2. **Write Tests That Give Confidence**
3. **Don't Mock What You Don't Own**
4. **Prefer Integration Over Unit When Possible**

---

## Performance Guidelines

### React Performance

1. **Memoize Expensive Computations**
   ```jsx
   const filtered = useMemo(() => 
       tasks.filter(expensive), [tasks]
   );
   ```

2. **Prevent Unnecessary Re-renders**
   ```jsx
   const MemoizedComponent = React.memo(Component);
   ```

3. **Virtualize Long Lists**
   - Use `react-window` for 100+ items

### Bundle Performance

1. **Code Split Routes** (when added)
2. **Lazy Load Modals**
3. **Tree Shake Imports**

---

## Error Handling

### Error Boundaries

```jsx
<ErrorBoundary fallback={<ErrorFallback />}>
    <Component />
</ErrorBoundary>
```

### Async Error Pattern

```javascript
try {
    await riskyOperation();
} catch (error) {
    dispatch(showNotification({ 
        type: 'error', 
        message: error.message 
    }));
    console.error('Context:', error);
}
```

---

## Code Review Checklist

Before submitting:

- [ ] Does it work? (manual testing)
- [ ] Is it readable? (self-documenting code)
- [ ] Is it performant? (no unnecessary re-renders)
- [ ] Is it accessible? (keyboard, screen readers)
- [ ] Is it consistent? (follows existing patterns)
- [ ] Is it safe? (handles edge cases)

---

## Definition of Done

A feature is "done" when:

1. ✅ Code is written and reviewed
2. ✅ Tests pass (if applicable)
3. ✅ Works on Chrome, Firefox, Safari
4. ✅ Responsive on desktop and tablet
5. ✅ Accessible (keyboard navigation works)
6. ✅ No console errors
7. ✅ Documentation updated (if needed)

---

## Development Environment

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| VS Code | Latest | Recommended IDE |

### Recommended Extensions

- ESLint
- Prettier
- GitLens
- React Developer Tools

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Documentation Standards

### Code Comments

```javascript
// ✅ Good: Explains WHY
// Debounce to prevent excessive API calls during typing
const debouncedSearch = useDebouncedCallback(search, 300);

// ❌ Bad: Explains WHAT (code already shows this)
// Add task to array
tasks.push(newTask);
```

### JSDoc for Public Functions

```javascript
/**
 * Parses natural language task input into structured data.
 * @param {string} input - Raw user input
 * @returns {ParsedTask} Structured task object
 * @example parseTaskInput("Buy milk #groceries !high")
 */
export function parseTaskInput(input) { ... }
```

---

> "Write code as if the person maintaining it is a violent psychopath who knows where you live."
> — *John Woods*

We write for humans first, computers second.
