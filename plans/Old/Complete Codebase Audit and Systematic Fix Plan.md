# Objective
Scan entire codebase, document ALL issues preventing app from loading, then fix them systematically one by one\.
# Phase 1: Complete Audit \(DO NOT SKIP\)
## Step 1\.1: Scan all page files for structure issues
* List all 29 page\.tsx files
* Check each one for:
    * Duplicate SidebarNavigation imports/usage
    * Improper layout structure
    * localStorage access without SSR guards
    * React Hooks violations \(conditional useState/useEffect\)
    * Missing "use client" directives where needed
## Step 1\.2: Scan all component files
* Check components/layout/\*\.tsx for SSR issues
* Check components/\*/page\.tsx for client\-side API access
* Find all `localStorage.getItem()` calls without `typeof window` checks
* Find all `document.` or `window.` access without guards
## Step 1\.3: Scan configuration files
* Check next\.config\.mjs for deprecated options
* Check tsconfig\.json for issues
* Check \.env files for missing variables
## Step 1\.4: Create complete issue log
Document in markdown:
* File path
* Line number
* Issue type
* Severity \(CRITICAL/HIGH/MEDIUM/LOW\)
* Fix needed
# Phase 2: Fix Critical Issues \(Blocking App Load\)
## Priority 1: Layout Router Mount Issue
Problem: "invariant expected layout router to be mounted"
Cause: Multiple possible:
1. Children wrapped in client component in root layout
2. Multiple SidebarNavigation instances rendering
3. Conflicting layout structures
Fix approach:
* Root layout must have direct \{children\} with no client wrapper
* Each page must handle its own layout structure
* SidebarNavigation rendered once per page, not in root
## Priority 2: SSR Hydration Mismatches
Files to fix:
* lib/theme\-context\.tsx \- localStorage access
* lib/language\-context\.tsx \- localStorage access  
* components/layout/sidebar\-navigation\.tsx \- clientAuth access
* All page files with auth checks
Fix: Wrap ALL browser API access in:
```typescript
if (typeof window !== 'undefined') {
  // browser code
}
```
## Priority 3: React Hooks Violations
Scan for:
* useState/useEffect called after conditional returns
* Hooks called inside loops or conditions
* Missing dependencies in useEffect
Fix: Move all hooks to top of component, before any conditionals
# Phase 3: Fix Each Page File
For each of the 29 pages:
1. Read entire file
2. Identify structure \(has auth? has sidebar? has layout?\)
3. Apply standard pattern:
```typescript
"use client"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
export default function Page() {
  // All hooks at top
  const [state, setState] = useState()
  const router = useRouter()
  
  // Effects after hooks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // client-only code
    }
  }, [])
  
  // Early returns after all hooks
  if (!loaded) return <div>Loading...</div>
  
  // Render
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        {/* page content */}
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
```
# Phase 4: Verification
1. Delete \.next completely
2. Start dev server
3. Test each route:
    * / \(dashboard\)
    * /clients
    * /jobs
    * /invoices/new
    * /invoices/archive
    * /maintenance
    * /settings
    * All sub\-routes
4. Document which routes fail
5. Fix failures
6. Repeat until all routes work
# Phase 5: Browser Cache Fix
* User's port 3000 is cached with old broken version
* Must test in incognito OR different port
* Clear browser cache not sufficient due to service workers
# Execution Plan
## Round 1: Audit \(Next 5\-10 tool calls\)
* Read all 29 page files
* Read all layout components
* Create issue log
* NO FIXES YET
## Round 2: Root Layout Fix \(1\-2 tool calls\)
* Fix app/layout\.tsx to not wrap children
* Verify it's clean
## Round 3: Fix Pages in Batches \(20\+ tool calls\)
* Fix 5\-10 pages per batch
* Test after each batch
* Document results
## Round 4: Provider Fixes \(5\+ tool calls\)  
* Fix all SSR issues in providers
* Add proper guards
* Test hydration
## Round 5: Final Verification \(3\+ tool calls\)
* Clean build
* Test all routes
* Document remaining issues
# Success Criteria
* Dev server starts without errors
* All pages load without "layout router not mounted"
* No hydration mismatch warnings
* User can navigate between all pages
* No React Hooks violations
* Works in fresh browser session
