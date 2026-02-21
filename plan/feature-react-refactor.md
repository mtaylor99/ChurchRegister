---
goal: Refactor React Application to Ensure Consistent Patterns, Best Practices, and Architecture
version: 1.0
date_created: 2026-02-20
last_updated: 2026-02-20
owner: Development Team
status: "Planned"
tags: [refactor, architecture, react, frontend, best-practices, consistency, type-safety]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan addresses architectural inconsistencies and improves best practices in the ChurchRegister React application. While the application has strong foundations with React 19, TypeScript, Material-UI, React Query, and Vite, there are structural inconsistencies across features that can be improved for better maintainability, testability, and developer experience.

The primary goal is to ensure all React components, hooks, services, and utilities follow consistent best practices and architectural patterns while maintaining backward compatibility and existing functionality.

## Current State Analysis

**Strengths:**
- Modern React 19 with hooks and functional components
- TypeScript with strict mode enabled
- React Query for server state management
- Material-UI for consistent UI
- Path aliases configured (`@components`, `@hooks`, etc.)
- Code splitting and lazy loading in place
- Error boundaries implemented
- Centralized API client with interceptors

**Areas for Improvement:**
- **Form Validation**: Mixed patterns (react-hook-form, manual validation, inline checks)
- **Component Props**: Inconsistent interface exports (some exported, some internal only)
- **API Services**: Inconsistent class-based vs object-based patterns
- **Query Keys**: Some hardcoded strings, inconsistent factory patterns
- **Type Safety**: Some `any` types, missing runtime validation with Zod
- **Error Handling**: Multiple patterns for displaying errors
- **Barrel Exports**: Not all feature folders have `index.ts`
- **Custom Hooks**: Varying structure and documentation quality
- **Component Patterns**: Mix of controlled/uncontrolled patterns
- **Testing**: Incomplete coverage, missing integration tests for key flows

## 1. Requirements & Constraints

### Requirements

- **REQ-001**: All components must follow consistent prop interface patterns with TypeScript
- **REQ-002**: Form validation must use centralized Yup/Zod schemas
- **REQ-003**: All API services must follow consistent class-based pattern
- **REQ-004**: React Query query keys must use factory pattern consistently
- **REQ-005**: All feature folders must have barrel exports (`index.ts`)
- **REQ-006**: Custom hooks must follow naming and structure conventions
- **REQ-007**: Error handling must use consistent patterns across all components
- **REQ-008**: Type safety must be enforced - no `any` types without justification
- **REQ-009**: All components must be accessible (WCAG 2.1 AA)
- **REQ-010**: Performance must not regress (bundle size, load time, runtime)

### Security Requirements

- **SEC-001**: Maintain existing authentication and authorization patterns
- **SEC-002**: Ensure sensitive data is not exposed in client-side code
- **SEC-003**: No security regression during refactoring
- **SEC-004**: RBAC patterns must be preserved and enhanced

### Constraints

- **CON-001**: Cannot break existing functionality or user flows
- **CON-002**: Must maintain compatibility with backend API contracts
- **CON-003**: All existing tests must continue to pass
- **CON-004**: Refactoring must be incremental, feature by feature
- **CON-005**: Cannot introduce new major dependencies without approval
- **CON-006**: Must maintain React 19 compatibility
- **CON-007**: Bundle size must not increase significantly (< 5%)
- **CON-008**: Must maintain high test coverage (> 80%)

### Guidelines

- **GUD-001**: Follow React hooks rules strictly (hooks at top level, no conditional calls)
- **GUD-002**: Use functional components exclusively - no class components
- **GUD-003**: Prefer composition over prop drilling - use Context where appropriate
- **GUD-004**: Keep components small and focused (< 300 lines)
- **GUD-005**: Use TypeScript strict mode - leverage type inference
- **GUD-006**: Document complex logic and business rules with comments
- **GUD-007**: Use semantic HTML and ARIA attributes for accessibility
- **GUD-008**: Optimize re-renders with useMemo/useCallback where beneficial
- **GUD-009**: Follow Material-UI theming and styling conventions
- **GUD-010**: Write tests for business logic and complex component interactions

### Patterns to Follow

- **PAT-001**: Component structure: imports → interfaces → component → export
- **PAT-002**: Props interface: `export interface ComponentNameProps { ... }`
- **PAT-003**: API service: Class with methods, instantiated as singleton `export const apiService = new ApiService()`
- **PAT-004**: Query keys: Hierarchical factory pattern `{ all, lists, list, details, detail }`
- **PAT-005**: Custom hooks: `use[Feature]` naming, return object with destructuring
- **PAT-006**: Form validation: Centralized schemas in `src/validation/schemas/`
- **PAT-007**: Error display: Use ErrorAlert component, avoid inline error divs
- **PAT-008**: Loading states: Use skeleton loaders, not just spinners
- **PAT-009**: Barrel exports: Each feature folder exports via `index.ts`
- **PAT-010**: File naming: PascalCase for components, camelCase for utilities

## 2. Implementation Steps

### Phase 1: API Services Consistency

**GOAL-001**: Standardize all API services to consistent class-based pattern

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Review all API services in `src/services/api/` for pattern consistency                                              |           |      |
| TASK-002 | Convert object-based services to class-based pattern (if any)                                                       |           |      |
| TASK-003 | Ensure all API service classes follow naming convention `[Feature]Api`                                              |           |      |
| TASK-004 | Add JSDoc comments to all API service methods describing Request/Response                                            |           |      |
| TASK-005 | Verify all services are exported as singleton instances                                                              |           |      |
| TASK-006 | Create `src/services/api/README.md` documenting API service patterns                                                 |           |      |
| TASK-007 | Update `src/services/api/index.ts` barrel export to export all services consistently                                 |           |      |

### Phase 2: React Query Key Factories

**GOAL-002**: Implement consistent query key factory pattern across all features

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Create `src/hooks/queryKeys/index.ts` centralizing all query key factories                                          |           |      |
| TASK-009 | Refactor `church Members` hook query keys to use centralized factory                                                |           |      |
| TASK-010 | Refactor `contributions` hook query keys to use centralized factory                                                 |           |      |
| TASK-011 | Refactor `attendance` hook query keys to use centralized factory                                                    |           |      |
| TASK-012 | Refactor `reminders` hook query keys to use centralized factory                                                     |           |      |
| TASK-013 | Refactor `riskAssessments` hook query keys to use centralized factory                                               |           |      |
| TASK-014 | Refactor `trainingCertificates` hook query keys to use centralized factory                                          |           |      |
| TASK-015 | Refactor `administration` hook query keys to use centralized factory                                                |           |      |
| TASK-016 | Remove hardcoded query key strings from all hooks                                                                   |           |      |
| TASK-017 | Test query invalidation and caching with new key structure                                                          |           |      |

### Phase 3: Form Validation Schemas

**GOAL-003**: Centralize form validation schemas using Yup with consistent patterns

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-018 | Create `src/validation/schemas/` directory                                                                           |           |      |
| TASK-019 | Create `churchMemberSchema.ts` with Yup schemas for add/edit church member forms                                    |           |      |
| TASK-020 | Create `contributionSchema.ts` with Yup schemas for contribution forms                                              |           |      |
| TASK-021 | Create `userSchema.ts` with Yup schemas for add/edit user forms                                                     |           |      |
| TASK-022 | Create `authSchema.ts` with Yup schemas for login, change password, reset password                                  |           |      |
| TASK-023 | Create `attendanceSchema.ts` with Yup schemas for attendance forms                                                  |           |      |
| TASK-024 | Create `reminderSchema.ts` with Yup schemas for reminder forms                                                      |           |      |
| TASK-025 | Create `riskAssessmentSchema.ts` with Yup schemas for risk assessment forms                                         |           |      |
| TASK-026 | Create `trainingCertificateSchema.ts` with Yup schemas for training certificate forms                               |           |      |
| TASK-027 | Create `src/validation/schemas/index.ts` barrel export                                                              |           |      |
| TASK-028 | Update all forms to use centralized schemas instead of inline validation                                            |           |      |
| TASK-029 | Remove duplicate validation logic from components                                                                   |           |      |

### Phase 4: Component Props Interface Consistency

**GOAL-004**: Ensure all component props interfaces are exported and follow naming conventions

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-030 | Audit all components for props interface export consistency                                                         |           |      |
| TASK-031 | Export all props interfaces using `export interface ComponentNameProps`                                             |           |      |
| TASK-032 | Rename props interfaces to match component name convention                                                          |           |      |
| TASK-033 | Remove internal-only props interfaces where export is appropriate                                                   |           |      |
| TASK-034 | Add JSDoc comments to complex props explaining usage                                                                |           |      |
| TASK-035 | Update component documentation to reference exported props                                                          |           |      |

### Phase 5: Barrel Exports for Feature Folders

**GOAL-005**: Add barrel exports (`index.ts`) to all feature component folders

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-036 | Create `src/components/Reminders/index.ts` barrel export                                                            |           |      |
| TASK-037 | Create `src/components/RiskAssessments/index.ts` barrel export                                                      |           |      |
| TASK-038 | Create `src/components/Financial/index.ts` barrel export (if missing)                                               |           |      |
| TASK-039 | Create `src/components/Dashboard/index.ts` barrel export                                                            |           |      |
| TASK-040 | Create `src/components/Error/index.ts` barrel export                                                                |           |      |
| TASK-041 | Create `src/components/Feedback/index.ts` barrel export                                                             |           |      |
| TASK-042 | Update imports across application to use barrel exports                                                             |           |      |
| TASK-043 | Remove direct file imports where barrel exports exist                                                               |           |      |

### Phase 6: Custom Hooks Standardization

**GOAL-006**: Standardize structure and patterns across all custom hooks

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-044 | Document hook structure pattern in `src/hooks/README.md`                                                            |           |      |
| TASK-045 | Audit all hooks for consistent return types (object destructuring vs arrays)                                        |           |      |
| TASK-046 | Add JSDoc comments to all hooks describing purpose, params, and return                                              |           |      |
| TASK-047 | Ensure all hooks follow naming convention `use[Feature]` or `use[Action]`                                           |           |      |
| TASK-048 | Standardize error handling in hooks (return error state vs throw)                                                  |           |      |
| TASK-049 | Add TypeScript generics where appropriate for reusable hooks                                                        |           |      |
| TASK-050 | Extract common hook logic into shared utilities                                                                     |           |      |

### Phase 7: Error Display Consistency

**GOAL-007**: Standardize error display patterns across all components

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-051 | Audit all components for error display patterns                                                                     |           |      |
| TASK-052 | Replace inline error divs with ErrorAlert component                                                                 |           |      |
| TASK-053 | Ensure form errors use FormHelperText from Material-UI                                                              |           |      |
| TASK-054 | Standardize API error handling - toast for success/error, inline for validation                                     |           |      |
| TASK-055 | Remove duplicate error handling code                                                                                |           |      |
| TASK-056 | Add error recovery actions where appropriate (Retry button)                                                         |           |      |

### Phase 8: Type Safety Improvements

**GOAL-008**: Eliminate `any` types and add runtime type guards

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-057 | Audit codebase for `any` type usage                                                                                 |           |      |
| TASK-058 | Replace `any` with proper types or generics                                                                         |           |      |
| TASK-059 | Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` only where justified                           |           |      |
| TASK-060 | Create `src/utils/typeGuards.ts` with Zod runtime type guards                                                       |           |      |
| TASK-061 | Add runtime validation for API responses using Zod                                                                  |           |      |
| TASK-062 | Add type guards for user actions and events                                                                         |           |      |
| TASK-063 | Enable stricter TypeScript compiler options if not already enabled                                                  |           |      |

### Phase 9: Component Patterns Consistency

**GOAL-009**: Ensure all components follow consistent structure and patterns

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-064 | Create component structure template in `docs/react-component-template.md`                                           |           |      |
| TASK-065 | Audit large components (>300 lines) and split into smaller units                                                    |           |      |
| TASK-066 | Standardize controlled vs uncontrolled component patterns                                                           |           |      |
| TASK-067 | Add missing accessibility attributes (ARIA roles, labels, descriptions)                                             |           |      |
| TASK-068 | Ensure all forms have proper focus management and keyboard navigation                                                |           |      |
| TASK-069 | Add loading states to all async operations using skeleton loaders                                                  |           |      |
| TASK-070 | Implement optimistic UI updates where appropriate                                                                   |           |      |
| TASK-071 | Ensure all modals/drawers have proper close handlers and escape key support                                         |           |      |

### Phase 10: Performance Optimization

**GOAL-010**: Optimize components for better performance without breaking functionality

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-072 | Audit React DevTools Profiler for unnecessary re-renders                                                            |           |      |
| TASK-073 | Add `useMemo` for expensive calculations in components                                                              |           |      |
| TASK-074 | Add `useCallback` for callbacks passed to child components                                                          |           |      |
| TASK-075 | Use `React.memo` for pure components that re-render frequently                                                      |           |      |
| TASK-076 | Analyze bundle size and split large chunks further if needed                                                        |           |      |
| TASK-077 | Lazy load heavy components (PDF generators, chart libraries)                                                        |           |      |
| TASK-078 | Optimize Material-UI imports (tree-shaking)                                                                         |           |      |
| TASK-079 | Add pagination/virtualization for large lists if not present                                                        |           |      |

### Phase 11: Testing Improvements

**GOAL-011**: Increase test coverage and add integration tests for critical flows

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-080 | Audit current test coverage and identify gaps                                                                       |           |      |
| TASK-081 | Add unit tests for all custom hooks                                                                                |           |      |
| TASK-082 | Add unit tests for utility functions                                                                               |           |      |
| TASK-083 | Add component tests for critical user flows (login, add member, submit contribution)                                |           |      |
| TASK-084 | Add integration tests for multi-step workflows                                                                      |           |      |
| TASK-085 | Add E2E tests using Playwright for happy paths                                                                     |           |      |
| TASK-086 | Add visual regression tests for key pages (optional)                                                                |           |      |
| TASK-087 | Ensure test coverage is above 80% for business logic                                                                |           |      |

### Phase 12: Documentation & Code Quality

**GOAL-012**: Improve code documentation and maintain high quality standards

| Task     | Description                                                                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-088 | Update `docs/ARCHITECTURE.md` with refactoring improvements                                                         |           |      |
| TASK-089 | Create `docs/react-best-practices.md` documenting patterns and conventions                                          |           |      |
| TASK-090 | Run ESLint and fix all warnings                                                                                     |           |      |
| TASK-091 | Run Prettier and ensure consistent formatting                                                                       |           |      |

## 3. Alternatives

Alternative approaches that were considered:

- **ALT-001**: **Complete Rewrite** - Rebuild application from scratch with new architecture. Rejected because current foundation is solid, risk is too high, and incremental refactoring provides same benefits with less disruption.

- **ALT-002**: **Migrate to Different Framework** - Switch to Next.js, Remix, or other React meta-framework. Rejected because Vite + React Router meets current needs, migration cost is high, and provides minimal benefit for this application type.

- **ALT-003**: **Keep Mixed Patterns** - Allow different features to have different patterns. Rejected because it creates confusion, makes onboarding harder, reduces code discoverability, and increases maintenance burden.

- **ALT-004**: **Use Formik Instead of React Hook Form** - Swap form library. Rejected because React Hook Form is already integrated, performant, and team is familiar with it.

- **ALT-005**: **Use Zod Instead of Yup** - Switch validation library. Partially accepted - use both where appropriate (Yup for forms, Zod for runtime type guards).

- **ALT-006**: **Batch Refactor All Features** - Refactor everything simultaneously. Rejected in favor of incremental approach to reduce risk, allow testing between phases, and avoid merge conflicts.

- **ALT-007**: **Skip Testing Improvements** - Focus only on code refactoring. Rejected because tests are critical for ensuring refactoring doesn't break functionality.

## 4. Dependencies

External and internal dependencies for this refactoring:

- **DEP-001**: React 19 - Core framework (already installed)
- **DEP-002**: TypeScript 5.9+ - Type system (already installed)
- **DEP-003**: Material-UI v7 - UI component library (already installed)
- **DEP-004**: React Query v5 - Server state management (already installed)
- **DEP-005**: React Hook Form v7 - Form state management (already installed)
- **DEP-006**: Yup v1.7+ - Schema validation (already installed)
- **DEP-007**: Zod v4+ - Runtime type validation (already installed)
- **DEP-008**: Vite v7 - Build tool (already installed)
- **DEP-009**: Vitest - Testing framework (already installed)
- **DEP-010**: Playwright - E2E testing (already installed)
- **DEP-011**: React Router v7 - Routing (already installed)
- **DEP-012**: Axios - HTTP client (already installed)
- **DEP-013**: ESLint & Prettier - Code quality tools (already installed)
- **DEP-014**: Storybook - Component documentation (already installed)

## 5. Files

Files that will be created, modified, or deleted during this refactoring:

### New Files - Validation Schemas

- **FILE-001**: `src/validation/schemas/churchMemberSchema.ts` - NEW
- **FILE-002**: `src/validation/schemas/contributionSchema.ts` - NEW
- **FILE-003**: `src/validation/schemas/userSchema.ts` - NEW
- **FILE-004**: `src/validation/schemas/authSchema.ts` - NEW
- **FILE-005**: `src/validation/schemas/attendanceSchema.ts` - NEW
- **FILE-006**: `src/validation/schemas/reminderSchema.ts` - NEW
- **FILE-007**: `src/validation/schemas/riskAssessmentSchema.ts` - NEW
- **FILE-008**: `src/validation/schemas/trainingCertificateSchema.ts` - NEW
- **FILE-009**: `src/validation/schemas/index.ts` - NEW

### New Files - Query Keys

- **FILE-010**: `src/hooks/queryKeys/index.ts` - NEW (centralized query key factories)
- **FILE-011**: `src/hooks/queryKeys/churchMembersKeys.ts` - NEW
- **FILE-012**: `src/hooks/queryKeys/contributionsKeys.ts` - NEW
- **FILE-013**: `src/hooks/queryKeys/attendanceKeys.ts` - NEW
- **FILE-014**: `src/hooks/queryKeys/remindersKeys.ts` - NEW
- **FILE-015**: `src/hooks/queryKeys/riskAssessmentsKeys.ts` - NEW
- **FILE-016**: `src/hooks/queryKeys/trainingCertificatesKeys.ts` - NEW

### New Files - Type Guards & Utilities

- **FILE-017**: `src/utils/typeGuards.ts` - NEW
- **FILE-018**: `src/utils/formHelpers.ts` - NEW

### New Files - Barrel Exports

- **FILE-019**: `src/components/Reminders/index.ts` - NEW
- **FILE-020**: `src/components/RiskAssessments/index.ts` - NEW
- **FILE-021**: `src/components/Dashboard/index.ts` - NEW
- **FILE-022**: `src/components/Error/index.ts` - NEW
- **FILE-023**: `src/components/Feedback/index.ts` - NEW

### New Files - Documentation

- **FILE-024**: `src/hooks/README.md` - NEW
- **FILE-025**: `src/services/api/README.md` - NEW
- **FILE-026**: `docs/react-best-practices.md` - NEW
- **FILE-027**: `docs/react-component-template.md` - NEW
- **FILE-028**: `CONTRIBUTING.md` - NEW

### Modified Files - API Services

- **FILE-029**: `src/services/api/index.ts` - MODIFIED
- **FILE-030**: `src/services/api/churchMembersApi.ts` - MODIFIED (add JSDoc)
- **FILE-031**: `src/services/api/contributionsApi.ts` - MODIFIED (add JSDoc)
- **FILE-032**: `src/services/api/attendanceApi.ts` - MODIFIED (add JSDoc)
- **FILE-033**: `src/services/api/remindersApi.ts` - MODIFIED (add JSDoc)
- **FILE-034**: `src/services/api/riskAssessmentsApi.ts` - MODIFIED (add JSDoc)
- **FILE-035**: `src/services/api/trainingCertificatesApi.ts` - MODIFIED (add JSDoc)

### Modified Files - Hooks

- **FILE-036**: All hooks in `src/hooks/` - MODIFIED (query keys, JSDoc, return types)

### Modified Files - Components (Representative Sample)

- **FILE-037**: All form components - MODIFIED (use centralized validation schemas)
- **FILE-038**: All components with props - MODIFIED (export props interfaces)
- **FILE-039**: All components with errors - MODIFIED (use ErrorAlert component)
- **FILE-040**: All components with `any` - MODIFIED (add proper types)

### Modified Files - Configuration & Documentation

- **FILE-041**: `docs/ARCHITECTURE.md` - MODIFIED
- **FILE-042**: `tsconfig.json` - MODIFIED (stricter options if needed)
- **FILE-043**: `.eslintrc.cjs` - MODIFIED (stricter rules)

### Deleted Files

- **FILE-044**: Duplicate validation utility files - DELETED (consolidated)
- **FILE-045**: Obsolete helper files - DELETED (if any)

## 6. Testing

Testing requirements to verify successful implementation of refactoring:

- **TEST-001**: **Build Verification** - Application builds without errors
- **TEST-002**: **Type Checking** - TypeScript compilation passes with no errors
- **TEST-003**: **ESLint** - No linting errors or warnings
- **TEST-004**: **Unit Tests** - All unit tests pass
- **TEST-005**: **Integration Tests** - All integration tests pass
- **TEST-006**: **E2E Tests** - Critical user flows work in Playwright
- **TEST-007**: **Coverage** - Test coverage is above 80% for business logic
- **TEST-008**: **Bundle Size** - Bundle size has not increased significantly (<5%)
- **TEST-009**: **Performance** - No performance regression in lighthouse scores
- **TEST-010**: **Accessibility** - WCAG 2.1 AA compliance maintained
- **TEST-011**: **API Contracts** - All API calls work correctly
- **TEST-012**: **Authentication** - Login, logout, token refresh work
- **TEST-013**: **Authorization** - RBAC enforcement works correctly
- **TEST-014**: **Forms** - All forms validate and submit correctly
- **TEST-015**: **Navigation** - All routes and navigation work
- **TEST-016**: **Error Handling** - Errors display correctly with proper messages
- **TEST-017**: **Loading States** - Loading indicators appear appropriately
- **TEST-018**: **Responsive Design** - Application works on mobile/tablet/desktop
- **TEST-019**: **Cross-Browser** - Works in Chrome, Firefox, Safari, Edge
- **TEST-020**: **React Query** - Cache invalidation and refetching work correctly

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **Breaking Changes** - Refactoring could inadvertently break existing functionality. Mitigation: Incremental changes, comprehensive testing after each phase, maintain test coverage.

- **RISK-002**: **Type Errors** - Removing `any` types could reveal hidden type issues. Mitigation: Fix types incrementally, use type assertions with comments where necessary.

- **RISK-003**: **Performance Regression** - Adding useMemo/useCallback could cause issues if used incorrectly. Mitigation: Profile before and after changes, only optimize where beneficial.

- **RISK-004**: **Merge Conflicts** - Large-scale refactoring could conflict with ongoing work. Mitigation: Coordinate with team, work in dedicated branch, communicate scope.

- **RISK-005**: **Over-Engineering** - Could add unnecessary abstraction. Mitigation: Follow YAGNI principle, only abstract when pattern appears 3+ times.

- **RISK-006**: **Testing Gaps** - Tests might not catch all regressions. Mitigation: Combine unit, integration, and E2E tests; manual testing of critical flows.

- **RISK-007**: **Dependency Updates** - New patterns might require dependency updates causing compatibility issues. Mitigation: Test thoroughly, update dependencies incrementally.

- **RISK-008**: **Documentation Drift** - Docs might become outdated during refactoring. Mitigation: Update docs as part of each phase task list.

### Assumptions

- **ASSUMPTION-001**: Current React 19 and TypeScript versions are stable for production
- **ASSUMPTION-002**: Team agrees on Material-UI as the standard UI library
- **ASSUMPTION-003**: React Query is the accepted solution for server state management
- **ASSUMPTION-004**: No major feature additions during refactoring period
- **ASSUMPTION-005**: Existing API contracts are stable and won't change
- **ASSUMPTION-006**: Team has capacity to review and test refactored code
- **ASSUMPTION-007**: Yup and Zod can coexist for different validation purposes
- **ASSUMPTION-008**: Path aliases (`@components`, `@hooks`, etc.) will remain consistent
- **ASSUMPTION-009**: Bundle size optimization is a priority
- **ASSUMPTION-010**: Accessibility compliance (WCAG 2.1 AA) is mandatory
- **ASSUMPTION-011**: Storybook will be used for component documentation going forward
- **ASSUMPTION-012**: Vitest and Playwright provide adequate testing capabilities

## 8. Related Specifications / Further Reading

### External Documentation

- [React 19 Documentation](https://react.dev/) - Official React documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript language guide
- [React Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) - Query key factories
- [React Hook Form](https://react-hook-form.com/) - Form validation patterns
- [Yup Validation](https://github.com/jquense/yup) - Schema validation
- [Zod Documentation](https://zod.dev/) - Runtime type validation
- [Material-UI API Reference](https://mui.com/material-ui/api/) - MUI component props
- [Vite Guide](https://vitejs.dev/guide/) - Build optimization
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing
- [Playwright](https://playwright.dev/) - E2E testing framework
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards

### Internal Documentation

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Application architecture
- [docs/routing-navigation-conventions.md](../docs/routing-navigation-conventions.md) - Routing patterns
- [docs/error-handling-patterns.md](../docs/error-handling-patterns.md) - Error handling standards
- [plan/feature-api-refactor.md](./feature-api-refactor.md) - Backend refactoring plan

### Reference Implementations

- React Query keys: `src/hooks/useReminders.ts` (good factory pattern example)
- Form validation: `src/components/ChurchMembers/AddChurchMemberForm.tsx`
- API service: `src/services/api/remindersApi.ts` (class-based pattern)
- Error handling: `src/components/ErrorAlert/ErrorAlert.tsx`
- Loading states: `src/components/Loading/SkeletonLoader.tsx`
