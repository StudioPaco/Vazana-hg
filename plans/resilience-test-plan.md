# Resilience Testing Plan — Vazana V1

## Purpose
Find cracks, break points, duplicates, and leftover code before V1 launch.

---

## 1. Code Health Scan

### Dead Code Detection
```bash
# Find unused exports
npx ts-prune | grep -v "(used in module)"

# Find unused components
grep -r "export" components/ --include="*.tsx" -l | while read f; do
  base=$(basename "$f" .tsx)
  count=$(grep -r "$base" app/ components/ --include="*.tsx" -l | wc -l)
  [ "$count" -le 1 ] && echo "POSSIBLY UNUSED: $f"
done

# Find unused API routes
ls app/api/**/route.ts | while read f; do
  route=$(echo $f | sed 's|app/api||; s|/route.ts||; s|/\[|/:|g; s|\]||g')
  count=$(grep -r "\"$route\|'$route" components/ app/ lib/ --include="*.ts" --include="*.tsx" | wc -l)
  [ "$count" -eq 0 ] && echo "POSSIBLY UNUSED API: $route"
done
```

### Duplicate Code Detection
- Search for repeated patterns: similar fetch calls, similar form structures
- Check for duplicate utility functions across lib/ files
- Look for copy-pasted components with minor variations

### console.log Cleanup
```bash
# Should only have console.error, not console.log
grep -rn "console.log" components/ app/ lib/ hooks/ --include="*.ts" --include="*.tsx"
```

---

## 2. Database Integrity

### Orphan Records
```sql
-- Jobs without valid client
SELECT j.id, j.job_number FROM jobs j
LEFT JOIN clients c ON j.client_id = c.id WHERE c.id IS NULL;

-- Invoice line items without valid invoice
SELECT ili.id FROM invoice_line_items ili
LEFT JOIN invoices i ON ili.invoice_id = i.id WHERE i.id IS NULL;

-- Documents with missing entity references
SELECT d.id, d.entity_type, d.entity_id FROM documents d
WHERE d.entity_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM clients WHERE id = d.entity_id::uuid
  UNION SELECT 1 FROM jobs WHERE id = d.entity_id::uuid
);
```

### RLS Policy Audit
```sql
-- List all tables and their RLS status
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

-- List all policies
SELECT tablename, policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename, policyname;
```

### Data Consistency
```sql
-- Payment status values actually in use
SELECT DISTINCT payment_status, count(*) FROM jobs GROUP BY payment_status;

-- Job status values actually in use
SELECT DISTINCT job_status, count(*) FROM jobs GROUP BY job_status;

-- Shift type values actually in use
SELECT DISTINCT shift_type, count(*) FROM jobs GROUP BY shift_type;
```

---

## 3. Auth & Security Testing

### Session Tests
| Test | Steps | Expected |
|------|-------|----------|
| Session expiry | Login, wait 1+ hours, navigate | Should redirect to login or auto-refresh |
| Concurrent sessions | Login on 2 browsers | Both should work independently |
| CSRF | Open /api/jobs in incognito (no cookies) | Should return 401 or empty |
| Direct API access | `curl /api/users` without auth | Should return error, not data |
| Role escalation | Staff user tries POST to /api/users | Should be denied |

### Input Validation
| Test | Input | Expected |
|------|-------|----------|
| XSS in job name | `<script>alert(1)</script>` as site name | Escaped, no execution |
| SQL injection | `'; DROP TABLE jobs; --` as search | No effect, search works |
| Long string | 10,000 character company name | Handled gracefully (truncated or error) |
| Unicode | Emoji 🚗 as vehicle name | Saves and displays correctly |
| Negative numbers | -500 as rate | Either rejected or handled |

---

## 4. UI/UX Stress Tests

### Navigation Stress
| Test | Steps | Expected |
|------|-------|----------|
| Rapid navigation | Click 10 sidebar items in 3 seconds | All pages load, no white screen |
| Back button | Navigate 5 pages deep, press back 5 times | Returns to correct pages |
| Browser refresh | F5 on every page | All pages survive refresh |
| Tab duplication | Ctrl+click sidebar links | Multiple tabs work independently |

### Form Stress
| Test | Steps | Expected |
|------|-------|----------|
| Double submit | Click "צור עבודה" twice fast | Only one job created |
| Tab away mid-form | Fill half a form, switch tabs, come back | Form data preserved |
| Modal stack | Open resource modal → try opening another | No stacking, clean close |
| Cancel and retry | Start creating client → cancel → start again | Form resets cleanly |

### Data Volume
| Test | Steps | Expected |
|------|-------|----------|
| Many jobs | Create 50 jobs (via import) | List loads quickly, filters work |
| Many clients | Create 20 clients | Dropdowns load, no lag |
| Long job history | Client with 100+ jobs | History loads paginated |
| Many invoices | Create 10 invoices | Archive page handles it |

---

## 5. Error Recovery

### Network Failures
| Test | Steps | Expected |
|------|-------|----------|
| Offline mode | Disconnect network while on dashboard | Error message, no crash |
| Slow network | Throttle to 3G in DevTools | Loading states show, eventually loads |
| API timeout | Block /api/jobs temporarily | Error state, retry button or message |

### Edge Cases
| Test | Steps | Expected |
|------|-------|----------|
| Empty database | Delete all sample data | All pages show empty states |
| Missing client | Delete a client that has jobs | Jobs still show (with "לקוח לא ידוע") |
| Deleted job | Reference a deleted job in invoice | Handled gracefully |
| Zero amounts | Create job with 0 total_amount | Displays ₪0, calculations work |
| Future dates | Create job 2 years in the future | Calendar handles it, status = "ממתין" |
| Past dates | Create job 2 years ago | Status = "הושלם", payment check works |

---

## 6. Performance Benchmarks

### Page Load Times (target: <2s)
- Dashboard: ___ms
- Jobs list: ___ms
- Clients list: ___ms
- Invoice creation: ___ms
- Calendar week: ___ms
- Calendar month: ___ms
- Settings: ___ms

### Interaction Response (target: <200ms)
- Filter dropdown open: ___ms
- Search keystroke to results: ___ms
- Sort toggle: ___ms
- Modal open: ___ms
- Row expand/collapse: ___ms

---

## 7. Execution Plan

1. **Automated scans** (30 min): Run dead code, console.log, DB integrity queries
2. **Manual auth tests** (30 min): Session, role, input validation
3. **UI stress tests** (45 min): Navigation, forms, data volume
4. **Error recovery** (30 min): Network failures, edge cases
5. **Performance** (15 min): Page loads, interaction times
6. **Fix round** (variable): Address findings
7. **Re-test** (30 min): Verify fixes
