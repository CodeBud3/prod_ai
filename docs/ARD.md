# Architecture Requirements Document (ARD)
## ProdAI - Technical Architecture

**Version:** 1.0  
**Last Updated:** December 30, 2024  

---

## 1. System Overview

ProdAI is a **React-based Single Page Application (SPA)** with local-first data persistence using browser storage. The architecture prioritizes simplicity, performance, and extensibility.

```
┌─────────────────────────────────────────────────────────┐
│                     ProdAI SPA                          │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                  │
├─────────────────────────────────────────────────────────┤
│  State Management (Redux Toolkit)                       │
├─────────────────────────────────────────────────────────┤
│  Business Logic (Utilities, NLP, Calculations)         │
├─────────────────────────────────────────────────────────┤
│  Persistence (LocalStorage via redux-persist)          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Core Technologies
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| UI Framework | React | 18.x | Component-based UI |
| State Management | Redux Toolkit | 2.x | Global state management |
| Persistence | redux-persist | 6.x | Local storage sync |
| Animations | Framer Motion | 11.x | Smooth animations |
| Build Tool | Vite | 5.x | Fast development & builds |
| Styling | CSS3 | - | Custom design system |

### Supporting Libraries
| Library | Purpose |
|---------|---------|
| chrono-node | Natural language date parsing |
| uuid | Unique ID generation |
| react-icons | Icon library |
| use-animations | Animated icons |

---

## 3. Directory Structure

```
src/
├── components/          # Shared UI components
│   └── ui/              # Design system primitives
├── features/            # Feature-based modules
│   ├── brainDump/       # Brain dump feature
│   ├── dashboard/       # Main dashboard & widgets
│   ├── notifications/   # Toast notifications
│   ├── onboarding/      # User onboarding wizard
│   ├── plan/            # AI planning features
│   ├── tasks/           # Task management core
│   └── user/            # User profile & preferences
├── hooks/               # Custom React hooks
├── store/               # Redux store configuration
├── utils/               # Utility functions
├── App.jsx              # Root component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

---

## 4. Data Architecture

### 4.1 State Shape

```javascript
{
  user: {
    name: string,
    role: string,
    onboarded: boolean,
    preferences: {
      theme: 'dark' | 'light',
      gamification: boolean,
      focusMode: boolean
    },
    stats: {
      xp: number,
      level: number,
      streak: number,
      tasksCompleted: number
    }
  },
  tasks: {
    items: Task[],
    filter: 'all' | 'today' | 'upcoming',
    sortBy: 'createdAt' | 'dueDate' | 'priority'
  },
  brainDump: {
    isOpen: boolean,
    rawInput: string,
    parsedTasks: ParsedTask[]
  },
  notifications: {
    items: Notification[]
  }
}
```

### 4.2 Task Entity

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  quadrant: 1 | 2 | 3 | 4 | null;  // Eisenhower Matrix
  project?: string;
  bucket?: string;
  dueDate?: string;  // ISO date string
  estimatedMinutes?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

### 4.3 User Entity

```typescript
interface User {
  name: string;
  role: string;
  onboarded: boolean;
  preferences: UserPreferences;
  stats: UserStats;
}

interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  tasksCompleted: number;
  tasksCompletedToday: number;
}
```

---

## 5. Component Architecture

### 5.1 Component Hierarchy

```
App
├── Wizard (onboarding)
├── Dashboard
│   ├── Header
│   │   ├── UserGreeting
│   │   ├── StreakDisplay
│   │   └── XPBar
│   ├── QuickAdd
│   ├── TaskList
│   │   └── TaskCard (×n)
│   ├── Sidebar
│   │   ├── ProjectList
│   │   ├── BucketList
│   │   └── StatsWidget
│   └── FocusMode (conditional)
├── BrainDumpModal
│   ├── TextInput
│   └── TaskStagingArea
└── NotificationProvider
    └── Toast (×n)
```

### 5.2 Component Design Principles

1. **Feature-First Organization**: Components grouped by feature, not type
2. **Container/Presentational Split**: Logic in slices, UI in components
3. **Composition Over Inheritance**: Use hooks and context for shared behavior
4. **Colocation**: Keep related code together (component + styles + tests)

---

## 6. State Management Patterns

### 6.1 Redux Slice Pattern

Each feature has its own slice with:
- State definition
- Reducers (sync actions)
- Selectors (memoized queries)
- Thunks (async actions, if needed)

```javascript
// Example: tasksSlice.js
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action) => { ... },
    updateTask: (state, action) => { ... },
    deleteTask: (state, action) => { ... },
    completeTask: (state, action) => { ... }
  }
});
```

### 6.2 Selector Pattern

```javascript
// Memoized selectors for performance
export const selectTodaysTasks = createSelector(
  [selectAllTasks],
  (tasks) => tasks.filter(task => isToday(task.dueDate))
);
```

---

## 7. Performance Considerations

### 7.1 Rendering Optimization
- React.memo for expensive components
- useMemo/useCallback for computed values
- Virtualized lists for 100+ tasks

### 7.2 State Optimization
- Normalized state shape for tasks
- Selective persistence (only essential data)
- Debounced persistence writes

### 7.3 Bundle Optimization
- Code splitting by route
- Lazy loading for modals
- Tree-shaking unused dependencies

---

## 8. Extensibility Points

### 8.1 Plugin Architecture (Future)
```
plugins/
├── calendar-sync/
├── notion-import/
└── ai-suggestions/
```

### 8.2 Theme System
```css
:root {
  --primary: #8b5cf6;
  --surface-primary: rgba(17, 17, 17, 0.95);
  --text-primary: rgba(255, 255, 255, 0.95);
  /* ... */
}
```

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|------------|
| XSS | React's built-in escaping |
| Data Privacy | Local-only storage (no server) |
| Persistence | Encrypted localStorage (future) |
| Input Validation | Sanitize NLP inputs |

---

## 10. Deployment Architecture

### Current (v1.0)
```
[Static Files] → [CDN/Hosting] → [Browser]
                                     ↓
                              [LocalStorage]
```

### Future (v2.0)
```
[Browser] ←→ [API Gateway] ←→ [Backend Services]
                                    ↓
                              [Database]
```

---

## 11. Monitoring & Analytics (Future)

| Metric | Tool | Purpose |
|--------|------|---------|
| Core Web Vitals | Lighthouse | Performance |
| Error Tracking | Sentry | Reliability |
| User Analytics | Posthog | Behavior |
| Feature Flags | LaunchDarkly | Experimentation |

---

## Appendix: Tech Decisions Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Redux Toolkit over Context | Devtools, middleware, persistence | Zustand, Jotai |
| Vite over CRA | Speed, modern defaults | Webpack, Parcel |
| CSS over Tailwind | Full control, learning | Tailwind, Styled Components |
| Local-first | Privacy, simplicity | Firebase, Supabase |
