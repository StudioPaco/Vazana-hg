# Offline Mode Conflict Resolution Strategy

## Database Structure for Conflicts

### 1. Conflict Queue Table (IndexedDB)
```javascript
// Structure for storing conflicts until resolution
{
  id: uuid,
  table_name: string,
  record_id: string,
  conflict_type: 'update' | 'delete' | 'create',
  local_data: object,      // What user changed locally
  server_data: object,     // What exists on server
  timestamp: date,
  resolved: boolean,
  resolution_strategy: 'local_wins' | 'server_wins' | 'manual' | 'merge'
}
```

### 2. Sync Status Table (IndexedDB)
```javascript
{
  table_name: string,
  last_sync: timestamp,
  sync_in_progress: boolean,
  pending_changes: number
}
```

## Conflict Resolution Process

### Phase 1: Detection
1. **On Sync**: Compare local `updated_at` vs server `updated_at`
2. **If Different**: Record detected in conflict queue
3. **Show Indicator**: Display conflict count in UI

### Phase 2: Resolution UI
```
┌─────────────────────────────────────┐
│ ⚠️  Conflict Resolution Required     │
├─────────────────────────────────────┤
│ Job #1234 - Security Work           │
│ ├─ Your Version: Site A, ₪900       │
│ ├─ Server Version: Site B, ₪1200    │
│ └─ Actions: [Keep Mine] [Keep Theirs] [Merge] │
└─────────────────────────────────────┘
```

### Phase 3: Resolution Strategies
1. **Auto-Resolution**: Based on business rules
   - Recent changes win (< 5 minutes)
   - Admin changes win over regular users
   
2. **Manual Resolution**: Present both versions
   - Side-by-side comparison
   - Field-by-field selection
   - Custom merge option

## Implementation Priority
1. **Jobs** (highest priority)
2. **Invoices** 
3. **Clients**
4. **Settings** (lowest priority)

## IndexedDB Schema
- `vazana_conflicts` - Conflict queue
- `vazana_sync_status` - Sync tracking  
- `vazana_local_jobs` - Offline job data
- `vazana_local_clients` - Offline client data