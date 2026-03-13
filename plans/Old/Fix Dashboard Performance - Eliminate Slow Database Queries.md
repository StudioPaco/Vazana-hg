# Dashboard Performance Optimization Plan
## Problem
Dashboard makes multiple heavy database queries on EVERY page load with NO caching:
* Query 1: All jobs for next 7 days with joins
* Query 2: All clients  
* Query 3: All jobs from last 30 days
This blocks UI rendering and causes 2\-3 second delays\.
## Solution Strategy
### Phase 1: Immediate Fixes \(Do First\)
1. **Add loading states** \- Show dashboard immediately with skeleton/loading states
2. **Lazy load stats** \- Render static UI first, load data after
3. **Add simple caching** \- Cache query results in component state for 5 minutes
### Phase 2: Optimize Queries
1. **Use COUNT queries** instead of fetching all records for stats
2. **Add database indexes** on frequently queried columns \(job\_date, client\_id\)
3. **Combine queries** \- Single query with aggregations instead of multiple
### Phase 3: Long\-term Architecture
1. **Move to API routes** \- Cache at API level, not component level
2. **Add React Query** \- Automatic caching, deduplication, background refetch
3. **Consider edge caching** \- Cache stats at CDN level
## Implementation Order
### Step 1: Add Loading States
File: `components/dashboard/main-dashboard.tsx:236`
* Render UI immediately with placeholder values
* Show skeleton loaders for stats
* Load data asynchronously without blocking render
### Step 2: Add Component\-Level Caching
* Cache query results with timestamp
* Check cache before querying \(5 min TTL\)
* Store in localStorage or state
### Step 3: Optimize Queries
Replace:
```SQL
SELECT * FROM clients
SELECT client_id FROM jobs WHERE...
```
With:
```SQL
SELECT COUNT(*) as total_clients FROM clients
SELECT COUNT(DISTINCT client_id) as active_clients FROM jobs WHERE...
```
## Expected Results
* Initial render: < 100ms \(instant UI\)
* Data load: < 500ms \(optimized queries\)
* Cached loads: < 50ms \(no database hit\)
* Overall perceived speed: 10x faster
