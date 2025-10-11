# Settings Database Audit & Mapping

## 📊 **CURRENT SETTINGS ANALYSIS**

### **✅ MAPPED TO DATABASE**

#### **1. Business Settings** (`business_settings` table)
- **Company Info**: name, email, registration, address, phone
- **Bank Details**: account name, bank name, branch, account number  
- **Financial**: VAT percentage, auto invoice sync
- **Shift Times**: day shift end, night shift end
- **Status**: ✅ FULLY MAPPED

#### **2. User Preferences** (`user_preferences` table)
- **Language**: Hebrew/English preference
- **Calendar**: Add to calendar default
- **Status**: ✅ FULLY MAPPED

### **❌ NOT MAPPED TO DATABASE (localStorage only)**

#### **3. UI/Theme Settings** 
**Current localStorage keys:**
- `vazana_theme_settings` - Contains:
  - `isDark` (boolean) - Dark mode toggle
  - `sidebarMinimizedByDefault` (boolean) - Sidebar state
  - `roundedContainers` (boolean) - UI styling
  - `colorTheme` (object) - Color scheme
- **Font Size**: Currently in component state only
- **Status**: ❌ NEEDS DATABASE TABLE

#### **4. Auto-Save Forms Settings**
**Current localStorage keys:**
- `vazana-auto-save-forms` - Boolean for auto-save enabled/disabled
- **Status**: ❌ NEEDS DATABASE TABLE

#### **5. Form Draft Data**
**Current localStorage keys:**
- `new-job-draft` - Auto-saved job form data with expiry
- `new-invoice-draft` - Auto-saved invoice form data with expiry
- **Status**: ❌ NEEDS DATABASE TABLE (optional - could stay localStorage)

#### **6. Payment Terms**
**Current localStorage keys:**
- `vazana-payment-terms` - Custom payment terms array
- **Status**: ❌ NEEDS DATABASE TABLE

#### **7. Dashboard Settings**
**Current localStorage keys:**
- `approachingJobsCount` - Number of approaching jobs to display
- **Status**: ❌ NEEDS DATABASE TABLE

## 🔧 **REQUIRED DATABASE TABLES**

### **Table 1: `ui_preferences`**
```sql
CREATE TABLE ui_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_dark_mode BOOLEAN DEFAULT false,
    sidebar_minimized_by_default BOOLEAN DEFAULT false,
    rounded_containers BOOLEAN DEFAULT true,
    color_theme JSONB DEFAULT '{"name":"Vazana Studio","primary":"#ffcc00","secondary":"#00dac0","accent":"#ffffff"}',
    font_size INTEGER DEFAULT 16 CHECK (font_size >= 12 AND font_size <= 20),
    auto_save_forms BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Table 2: `payment_terms`**
```sql
CREATE TABLE payment_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID, -- For multi-tenant future
    term_value VARCHAR(50) NOT NULL,
    term_label VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Table 3: `dashboard_preferences`**
```sql
CREATE TABLE dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    approaching_jobs_count INTEGER DEFAULT 3,
    auto_refresh_interval INTEGER DEFAULT 30, -- minutes
    default_date_range VARCHAR(20) DEFAULT 'current_month',
    show_stats_section BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Table 4: `form_drafts` (Optional)**
```sql
CREATE TABLE form_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    form_type VARCHAR(50) NOT NULL, -- 'new-job', 'new-invoice', etc.
    draft_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚨 **RECOMMENDATIONS**

### **User vs System Settings Decision:**
**You asked about per-user vs system-wide UI preferences. Here's my analysis:**

#### **Per-User Settings** (Recommended):
- **Theme/Dark mode** - Users have different preferences
- **Font size** - Accessibility varies per user
- **Auto-save preferences** - Personal workflow choice
- **Dashboard layout** - Individual productivity preferences

#### **System-Wide Settings** (Business Level):
- **Company branding/colors** - Should be consistent
- **Payment terms** - Business-wide configuration
- **Default shift times** - Operational consistency

### **Migration Priority:**
1. **HIGH**: UI preferences (theme, font, auto-save)
2. **MEDIUM**: Payment terms & dashboard preferences  
3. **LOW**: Form drafts (could stay localStorage)

### **Implementation Strategy:**
1. Create tables with migration script
2. Create settings hooks that sync localStorage → database
3. Gradual migration of existing localStorage data
4. Phase out localStorage for persistent settings

## 📋 **NEXT STEPS**
1. Create migration script for new tables
2. Update settings hooks to use database
3. Create localStorage → database migration utility
4. Test all settings persistence

**Would you like me to create the migration script now?**