# Functional Requirements Document (FRD)
## ProdAI - Detailed Functional Specifications

**Version:** 1.0  
**Last Updated:** December 30, 2024  

---

## 1. User Management

### 1.1 Onboarding

| ID | Requirement | Priority |
|----|-------------|----------|
| UM-001 | System shall display onboarding wizard for first-time users | P0 |
| UM-002 | Wizard shall collect user's display name | P0 |
| UM-003 | After name submission, system shall redirect to Dashboard | P0 |
| UM-004 | Brain Dump modal shall auto-open for users with zero tasks | P0 |
| UM-005 | Onboarding state shall persist across browser sessions | P0 |

### 1.2 User Preferences

| ID | Requirement | Priority |
|----|-------------|----------|
| UP-001 | User shall be able to toggle gamification on/off | P1 |
| UP-002 | User shall be able to toggle focus mode on/off | P1 |
| UP-003 | Theme preference shall persist (dark/light) | P2 |
| UP-004 | Preferences shall apply immediately without page reload | P1 |

---

## 2. Task Management

### 2.1 Task Creation

| ID | Requirement | Priority |
|----|-------------|----------|
| TC-001 | User shall create tasks via Quick Add component | P0 |
| TC-002 | User shall create multiple tasks via Brain Dump | P0 |
| TC-003 | Tasks shall have unique identifiers | P0 |
| TC-004 | New tasks shall default to 'todo' status | P0 |
| TC-005 | System shall parse natural language for due dates | P1 |
| TC-006 | System shall parse `#project` syntax for project assignment | P1 |
| TC-007 | System shall parse `@bucket` syntax for bucket assignment | P1 |
| TC-008 | System shall parse `!high`, `!low` for priority | P1 |

### 2.2 Quick Add Specifications

| ID | Requirement | Priority |
|----|-------------|----------|
| QA-001 | Quick Add shall be accessible via keyboard shortcut | P1 |
| QA-002 | Quick Add shall show accordion expansion on focus | P0 |
| QA-003 | Parsed entities shall display as visual chips | P1 |
| QA-004 | User shall be able to clear individual fields | P1 |
| QA-005 | Discard button shall reset all input fields | P1 |
| QA-006 | Submit shall be disabled when title is empty | P0 |
| QA-007 | Quick Add shall close on outside click | P0 |

### 2.3 Task Properties

| Property | Type | Required | Default |
|----------|------|----------|---------|
| id | string | Yes | UUID |
| title | string | Yes | - |
| description | string | No | "" |
| status | enum | Yes | "todo" |
| priority | enum | No | "medium" |
| quadrant | number | No | null |
| project | string | No | null |
| bucket | string | No | null |
| dueDate | ISO string | No | null |
| estimatedMinutes | number | No | null |
| tags | string[] | No | [] |
| createdAt | ISO string | Yes | now() |
| updatedAt | ISO string | Yes | now() |
| completedAt | ISO string | No | null |

### 2.4 Task Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| TO-001 | User shall be able to mark task as complete | P0 |
| TO-002 | User shall be able to edit task title inline | P0 |
| TO-003 | User shall be able to delete a task | P0 |
| TO-004 | User shall be able to change task priority | P1 |
| TO-005 | User shall be able to assign task to quadrant | P1 |
| TO-006 | User shall be able to add/remove tags | P2 |
| TO-007 | Completed tasks shall show strikethrough styling | P0 |
| TO-008 | Task completion shall trigger XP gain (if gamification enabled) | P1 |

---

## 3. Brain Dump

### 3.1 Input Processing

| ID | Requirement | Priority |
|----|-------------|----------|
| BD-001 | Modal shall accept multi-line text input | P0 |
| BD-002 | Each line shall be parsed as a separate task | P0 |
| BD-003 | Lines starting with `-` shall have prefix stripped | P0 |
| BD-004 | Empty lines shall be ignored | P0 |
| BD-005 | Parsed tasks shall appear in staging area | P0 |

### 3.2 Task Staging

| ID | Requirement | Priority |
|----|-------------|----------|
| BS-001 | Staging area shall show all parsed tasks | P0 |
| BS-002 | User shall be able to edit task title before adding | P1 |
| BS-003 | User shall be able to remove task from staging | P1 |
| BS-004 | "Add All" shall add all staged tasks to main list | P0 |
| BS-005 | Modal shall close after successful add | P0 |

---

## 4. Dashboard

### 4.1 Layout Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DL-001 | Dashboard shall display user greeting with name | P0 |
| DL-002 | Dashboard shall show today's date | P0 |
| DL-003 | Dashboard shall display task count summary | P0 |
| DL-004 | Layout shall be responsive (desktop/tablet/mobile) | P1 |

### 4.2 Task Display

| ID | Requirement | Priority |
|----|-------------|----------|
| TD-001 | Tasks shall be displayed in a scrollable list | P0 |
| TD-002 | Tasks shall be filterable by status | P1 |
| TD-003 | Tasks shall be sortable by date, priority | P1 |
| TD-004 | Overdue tasks shall be visually highlighted | P1 |
| TD-005 | Today's tasks shall be prominently displayed | P0 |

### 4.3 Eisenhower Matrix

| ID | Requirement | Priority |
|----|-------------|----------|
| EM-001 | User shall be able to view tasks in 4-quadrant grid | P1 |
| EM-002 | Tasks shall be draggable between quadrants | P2 |
| EM-003 | Quadrants shall be labeled appropriately | P1 |
| EM-004 | Empty quadrants shall show placeholder text | P1 |

---

## 5. Gamification

### 5.1 XP System

| ID | Requirement | Priority |
|----|-------------|----------|
| XP-001 | User shall earn XP for completing tasks | P1 |
| XP-002 | XP amount shall vary by task priority | P1 |
| XP-003 | XP progress bar shall display on dashboard | P1 |
| XP-004 | Level up shall trigger celebration animation | P1 |

### XP Values

| Action | XP Amount |
|--------|-----------|
| Complete low priority task | 10 |
| Complete medium priority task | 20 |
| Complete high priority task | 35 |
| Complete critical task | 50 |
| Maintain daily streak | 25 |

### 5.2 Streak System

| ID | Requirement | Priority |
|----|-------------|----------|
| ST-001 | Streak shall increment on daily task completion | P1 |
| ST-002 | Streak shall reset if no tasks completed for 24h | P1 |
| ST-003 | Streak count shall display on dashboard | P1 |
| ST-004 | Streak milestones shall trigger rewards | P2 |

### 5.3 Level Progression

| Level | XP Required | Title |
|-------|-------------|-------|
| 1 | 0 | Starter |
| 2 | 100 | Initiate |
| 3 | 300 | Achiever |
| 4 | 600 | Pro |
| 5 | 1000 | Expert |
| 6 | 1500 | Master |
| 7 | 2500 | Legend |

---

## 6. Fun Tools

### 6.1 Goblin Mode

| ID | Requirement | Priority |
|----|-------------|----------|
| GM-001 | Shall filter tasks to ≤5 minute estimated duration | P2 |
| GM-002 | Shall display tasks in a focused, fun UI | P2 |
| GM-003 | Completion shall show celebratory animation | P2 |
| GM-004 | Shall show "all done" state when no quick tasks remain | P2 |

### 6.2 Bored Dice

| ID | Requirement | Priority |
|----|-------------|----------|
| BD-001 | Shall randomly select a task from active list | P2 |
| BD-002 | Dice roll shall have animation effect | P2 |
| BD-003 | Selected task shall be highlighted | P2 |
| BD-004 | User shall be able to re-roll | P2 |

---

## 7. Notifications

### 7.1 Toast Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| TN-001 | Success actions shall show green toast | P0 |
| TN-002 | Error actions shall show red toast | P0 |
| TN-003 | Toasts shall auto-dismiss after 3 seconds | P0 |
| TN-004 | User shall be able to manually dismiss toast | P1 |
| TN-005 | Multiple toasts shall stack vertically | P1 |

### 7.2 Motivational Popups

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-001 | Random popup shall appear after task completion | P2 |
| MP-002 | Popup shall contain motivational message | P2 |
| MP-003 | Popup shall auto-dismiss after 2 seconds | P2 |
| MP-004 | User shall be able to disable popups | P2 |

---

## 8. Data Persistence

### 8.1 Storage Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DP-001 | All user data shall persist in localStorage | P0 |
| DP-002 | Data shall persist across browser sessions | P0 |
| DP-003 | Data shall be recoverable after page refresh | P0 |
| DP-004 | Storage shall handle 1000+ tasks without degradation | P1 |

### 8.2 Data Export (Future)

| ID | Requirement | Priority |
|----|-------------|----------|
| DE-001 | User shall be able to export tasks as JSON | P3 |
| DE-002 | User shall be able to export tasks as CSV | P3 |
| DE-003 | Export shall include all task properties | P3 |

---

## 9. Accessibility

| ID | Requirement | Priority |
|----|-------------|----------|
| AC-001 | All interactive elements shall be keyboard accessible | P1 |
| AC-002 | Color contrast shall meet WCAG AA standards | P1 |
| AC-003 | Screen reader announcements for state changes | P2 |
| AC-004 | Focus indicators shall be visible | P1 |
| AC-005 | Animations shall respect reduced-motion preference | P2 |

---

## 10. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | < 2s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| First Contentful Paint | < 1.5s | Lighthouse |
| Task Add Latency | < 100ms | User perception |
| Animation Frame Rate | 60fps | DevTools |

---

## Appendix: UI Component States

### Task Card States
- Default (idle)
- Hover (elevated, actions visible)
- Focused (keyboard navigation)
- Completing (animation)
- Completed (strikethrough, faded)

### Button States
- Default
- Hover
- Active/Pressed
- Disabled
- Loading

### Input States
- Default
- Focused (highlighted border)
- Error (red border, error message)
- Success (green checkmark)
- Disabled (grayed out)
