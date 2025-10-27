# Phase 2: Files Reference Guide

Quick reference for all files created or modified in Phase 2.

---

## 📁 NEW FILES

### Checkout Extension (Core Implementation)

#### `extensions/checkout-address-autocomplete/shopify.extension.toml`
**Purpose:** Extension configuration for Shopify  
**Size:** ~30 lines  
**Key Settings:**
- Extension type: `ui_extension`
- Target: `purchase.checkout.delivery-address.render-after`
- Handle: `address-autocomplete-checkout`

**When to modify:**
- Change where extension appears in checkout
- Update extension metadata

---

#### `extensions/checkout-address-autocomplete/src/index.js`
**Purpose:** UI Extensions SDK version (advanced)  
**Size:** ~400 lines  
**Uses:** `@shopify/ui-extensions/checkout`  
**Features:**
- Modern checkout extensibility
- React-like component model
- Sandboxed environment

**When to use:**
- Building complex checkout customizations
- Need checkout UI components
- Want checkout events integration

**When NOT to use:**
- Simple autocomplete (use vanilla.js instead)
- Need broader compatibility

---

#### `extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js` ⭐
**Purpose:** Vanilla JS version (RECOMMENDED)  
**Size:** ~500 lines  
**Dependencies:** None  
**Features:**
- Works on all Shopify plans
- No build step required
- Easy to debug
- Handles 2-char country codes
- Context-aware (`context=checkout`)

**Deployment Options:**
1. **Checkout Extensibility** (all plans)
2. **checkout.liquid** (Plus only)
3. **Web Pixels** (all plans)

**Key Functions:**
```javascript
init()                    // Initialize extension
findAddressInput()        // Detect address1 field
enhanceAddressInput()     // Attach autocomplete
searchAddress()           // Call API
fillCountryField()        // Handle 2-char codes
```

**Configuration:**
```javascript
window.CheckoutAutocompleteConfig = {
  apiEndpoint: '/apps/proxy/address-autocomplete/search',
  shop: 'yourstore.myshopify.com',
  enabled: true,
  context: 'checkout'
};
```

---

#### `extensions/checkout-address-autocomplete/package.json`
**Purpose:** Extension metadata  
**Size:** ~15 lines  
**Note:** Minimal file, no dependencies needed

---

### Documentation Files

#### `PHASE_2_CHECKOUT_IMPLEMENTATION.md` 📚
**Purpose:** Complete implementation guide  
**Size:** 3,000+ lines  
**Sections:** 100+  
**Contents:**
- Overview and architecture
- Implementation steps (detailed)
- File-by-file guide
- Configuration options
- Testing guide (with examples)
- Troubleshooting (6 issues with solutions)
- FAQs (11 questions with detailed answers)
- Code examples and SQL queries

**When to use:**
- First-time implementation
- Troubleshooting issues
- Understanding architecture
- Training new developers

---

#### `PHASE_2_QUICK_START.md` ⚡
**Purpose:** 5-minute setup guide  
**Size:** ~300 lines  
**Contents:**
- Quick implementation (3 steps)
- Key points summary
- Configuration options
- Testing checklist
- Common issues
- Files reference

**When to use:**
- Quick setup
- Already familiar with Phase 1
- Need quick reference
- Debugging specific issue

---

#### `PHASE_2_TESTING_CHECKLIST.md` ✅
**Purpose:** Comprehensive testing guide  
**Size:** ~1,500 lines  
**Test Categories:** 23  
**Test Cases:** 200+  
**Contents:**
- Pre-deployment tests
- Checkout page tests
- Profile page independence tests
- Browser compatibility tests
- Performance tests
- Security tests
- Accessibility tests
- Integration tests
- Deployment tests
- Monitoring metrics

**When to use:**
- Before going live
- QA testing
- Regression testing
- Performance validation

---

#### `PHASE_2_IMPLEMENTATION_SUMMARY.md` 📋
**Purpose:** High-level overview  
**Size:** ~600 lines  
**Contents:**
- What was implemented
- Deliverables list
- Architecture overview
- Requirements checklist
- Your questions answered
- Feature comparison table
- File changes summary
- Success criteria

**When to use:**
- Project overview
- Status reporting
- Decision review
- Onboarding

---

#### `PHASE_2_FILES_REFERENCE.md`
**Purpose:** This file - quick file reference  
**When to use:**
- Finding specific files
- Understanding file purposes
- Deciding which file to modify

---

## 📝 MODIFIED FILES

### Backend

#### `app/routes/api.address-autocomplete.search.tsx`
**Changes:** Context-aware API route  
**Lines Changed:** ~30 lines  
**New Features:**
- Context parameter detection
- `enabledCheckout` check
- `enabledProfile` check
- `detectContext()` function

**What was added:**
```typescript
// 1. Context detection
const context = url.searchParams.get("context") || detectContext(request);

// 2. Checkout-specific check
if (context === 'checkout' && !settings.enabledCheckout) {
  return json({ error: "Service not enabled for checkout" }, { status: 403 });
}

// 3. Profile-specific check
if (context === 'profile' && !settings.enabledProfile) {
  return json({ error: "Service not enabled for profile" }, { status: 403 });
}

// 4. Auto-detection from referer
function detectContext(request: Request): 'checkout' | 'profile' | 'unknown' {
  const referer = request.headers.get('referer') || '';
  if (referer.includes('/checkout')) return 'checkout';
  if (referer.includes('/account')) return 'profile';
  return 'profile';
}
```

**Testing:**
```bash
# Test checkout context
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=checkout"

# Test profile context
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=profile"
```

---

### Frontend

#### `extensions/address-autocomplete/assets/address-autocomplete.js`
**Changes:** Profile context parameter  
**Lines Changed:** 2 lines  
**New Features:**
- Explicit `context: 'profile'`
- Sends context with API calls

**What was added:**
```javascript
// 1. In config
let config = {
  apiEndpoint: '/apps/address-autocomplete/search',
  enabled: true,
  minCharacters: 3,
  debounceDelay: 300,
  context: 'profile' // ◄── NEW
};

// 2. In API call
const response = await fetch(`${config.apiEndpoint}&q=${query}&context=${config.context}`);
//                                                                    ^^^^^^^^^^^^^^^^^ NEW
```

**Impact:**
- ✅ No breaking changes
- ✅ Profile pages still work exactly as before
- ✅ Now sends context for proper access control

---

### Documentation

#### `README.md`
**Changes:** Added Phase 2 section  
**Lines Changed:** ~20 lines  
**New Sections:**
- Phase 1 vs Phase 2 features
- Phase 2 highlights
- Documentation links

**What was added:**
```markdown
### Phase 2 (Checkout Pages) ✅ NEW!
- ✅ Checkout Autocomplete
- ✅ 2-Character Country Codes
- ✅ Independent Controls
- ✅ Uses Existing Fields
- ✅ Context-Aware API

## 📚 Documentation
- [Phase 2 Quick Start](./PHASE_2_QUICK_START.md)
- [Phase 2 Full Implementation](./PHASE_2_CHECKOUT_IMPLEMENTATION.md)
- [Phase 2 Testing Checklist](./PHASE_2_TESTING_CHECKLIST.md)
```

---

## 🗂️ FILE TREE

```
swift-address-autocomplete/
├── app/
│   └── routes/
│       └── api.address-autocomplete.search.tsx    [MODIFIED] ⚡
│
├── extensions/
│   ├── address-autocomplete/                      [Existing - Phase 1]
│   │   └── assets/
│   │       └── address-autocomplete.js            [MODIFIED] ⚡
│   │
│   └── checkout-address-autocomplete/             [NEW] ⭐
│       ├── src/
│       │   ├── index.js                           [NEW] 🆕
│       │   └── checkout-autocomplete-vanilla.js   [NEW] 🆕 ⭐ RECOMMENDED
│       ├── shopify.extension.toml                 [NEW] 🆕
│       └── package.json                           [NEW] 🆕
│
├── PHASE_2_CHECKOUT_IMPLEMENTATION.md             [NEW] 🆕 📚 MAIN GUIDE
├── PHASE_2_QUICK_START.md                         [NEW] 🆕 ⚡ QUICK REF
├── PHASE_2_TESTING_CHECKLIST.md                   [NEW] 🆕 ✅ TESTING
├── PHASE_2_IMPLEMENTATION_SUMMARY.md              [NEW] 🆕 📋 OVERVIEW
├── PHASE_2_FILES_REFERENCE.md                     [NEW] 🆕 📁 THIS FILE
│
└── README.md                                      [MODIFIED] ⚡
```

**Legend:**
- ⚡ Modified file
- 🆕 New file
- ⭐ Recommended/Important
- 📚 Main documentation
- ✅ Testing guide
- 📋 Summary/Overview
- 📁 Reference

---

## 🎯 WHICH FILE TO USE

### For Implementation

| Task | File |
|------|------|
| **Quick 5-min setup** | `PHASE_2_QUICK_START.md` ⚡ |
| **Full implementation** | `PHASE_2_CHECKOUT_IMPLEMENTATION.md` 📚 |
| **Understanding architecture** | `PHASE_2_IMPLEMENTATION_SUMMARY.md` 📋 |
| **Testing before deploy** | `PHASE_2_TESTING_CHECKLIST.md` ✅ |
| **Finding specific file** | `PHASE_2_FILES_REFERENCE.md` (this file) 📁 |

### For Deployment

| Method | File to Deploy |
|--------|----------------|
| **Checkout Extensibility** | `checkout-autocomplete-vanilla.js` (via CLI) ⭐ |
| **checkout.liquid** | `checkout-autocomplete-vanilla.js` (manual) |
| **Web Pixels** | `checkout-autocomplete-vanilla.js` (copy/paste) |

### For Customization

| What to Customize | File to Edit |
|-------------------|--------------|
| **Checkout behavior** | `checkout-autocomplete-vanilla.js` |
| **Profile behavior** | `address-autocomplete.js` |
| **API logic** | `api.address-autocomplete.search.tsx` |
| **Settings page** | `app.address-autocomplete.tsx` (not modified in Phase 2) |

---

## 📊 FILE STATISTICS

### Code Files
| File | Type | Lines | Dependencies |
|------|------|-------|--------------|
| `checkout-autocomplete-vanilla.js` | JavaScript | ~500 | None ✅ |
| `index.js` | JavaScript | ~400 | `@shopify/ui-extensions` |
| `api.address-autocomplete.search.tsx` | TypeScript | ~180 | Prisma, Remix |
| `address-autocomplete.js` | JavaScript | ~560 | None ✅ |

### Documentation Files
| File | Lines | Sections |
|------|-------|----------|
| `PHASE_2_CHECKOUT_IMPLEMENTATION.md` | 3,000+ | 100+ |
| `PHASE_2_TESTING_CHECKLIST.md` | 1,500+ | 23 |
| `PHASE_2_IMPLEMENTATION_SUMMARY.md` | 600+ | 15 |
| `PHASE_2_QUICK_START.md` | 300+ | 8 |
| `PHASE_2_FILES_REFERENCE.md` | 400+ | 10 |

**Total Documentation:** 5,800+ lines

---

## 🔍 FINDING CODE SECTIONS

### In `checkout-autocomplete-vanilla.js`

**Find by Line Number:**
```javascript
Lines 1-50:    // Configuration and initialization
Lines 51-120:  // Form detection and enhancement
Lines 121-200: // Event handlers (input, keydown, blur, focus)
Lines 201-310: // Dropdown creation and styling
Lines 311-380: // API search and result display
Lines 381-450: // Address selection and form filling
Lines 451-500: // Utility functions (show/hide, escape HTML)
```

**Find by Function:**
```javascript
init()                    // Line 45 - Main init
findAddressInput()        // Line 71 - Detect field
enhanceAddressInput()     // Line 118 - Attach autocomplete
handleInput()             // Line 156 - Input event
handleKeyDown()           // Line 177 - Keyboard nav
searchAddress()           // Line 314 - API call
displayResults()          // Line 344 - Show dropdown
selectAddress()           // Line 394 - Fill form
fillCountryField()        // Line 433 - Country handling
```

### In `api.address-autocomplete.search.tsx`

**Key Sections:**
```typescript
Lines 18-22:   // Context detection and parameter parsing
Lines 38-49:   // Context-specific setting checks
Lines 154-174: // detectContext() function
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Read `PHASE_2_QUICK_START.md`
- [ ] Review `PHASE_2_CHECKOUT_IMPLEMENTATION.md` (at least once)
- [ ] Understand your deployment method (Extensibility/liquid/pixels)

### Files to Deploy
- [ ] `checkout-autocomplete-vanilla.js` (via chosen method)
- [ ] `shopify.extension.toml` (if using CLI)
- [ ] Modified `api.address-autocomplete.search.tsx` (backend)
- [ ] Modified `address-autocomplete.js` (profile - already deployed)

### Testing
- [ ] Follow `PHASE_2_TESTING_CHECKLIST.md`
- [ ] Test in development store first
- [ ] Verify both checkout AND profile work
- [ ] Test enable/disable toggles

### Documentation
- [ ] Keep all `.md` files in repo
- [ ] Share relevant docs with team
- [ ] Update internal documentation if needed

---

## 💡 TIPS

### For Developers
1. Start with `PHASE_2_QUICK_START.md` for overview
2. Use `checkout-autocomplete-vanilla.js` (recommended over `index.js`)
3. Test locally with `curl` commands (in testing checklist)
4. Check browser console for debug logs

### For QA
1. Use `PHASE_2_TESTING_CHECKLIST.md` as your test plan
2. Test all browsers (at least Chrome, Safari, Firefox)
3. Test on mobile devices
4. Verify country codes (US, CA, GB)

### For Project Managers
1. Read `PHASE_2_IMPLEMENTATION_SUMMARY.md` for status
2. Use checklists to track progress
3. Share `PHASE_2_QUICK_START.md` with stakeholders

### For Support
1. Start with troubleshooting section in main guide
2. Check browser console errors
3. Verify settings in admin
4. Test API endpoint directly

---

## 📞 QUICK COMMANDS

```bash
# Navigate to checkout extension
cd extensions/checkout-address-autocomplete

# Deploy extension
shopify app deploy

# Test API (profile context)
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=profile"

# Test API (checkout context)
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=checkout"

# View logs
npm run dev

# List extensions
shopify app list extensions
```

---

## 🎓 LEARNING PATH

**Beginner (First-time implementation):**
1. Read `PHASE_2_QUICK_START.md` (5 min)
2. Deploy following quick start steps (5 min)
3. Test in checkout (5 min)
4. If issues: Check troubleshooting in main guide

**Intermediate (Understanding the system):**
1. Read `PHASE_2_IMPLEMENTATION_SUMMARY.md` (15 min)
2. Review architecture section
3. Read file-by-file guide in main doc
4. Understand context pattern

**Advanced (Customization & extension):**
1. Read full `PHASE_2_CHECKOUT_IMPLEMENTATION.md` (45 min)
2. Study code in `checkout-autocomplete-vanilla.js`
3. Review API changes in `api.address-autocomplete.search.tsx`
4. Plan future enhancements (order status, etc.)

---

## ✅ FILE CHECKLIST

After Phase 2 implementation, you should have:

**New Files (8):**
- [ ] `extensions/checkout-address-autocomplete/shopify.extension.toml`
- [ ] `extensions/checkout-address-autocomplete/src/index.js`
- [ ] `extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js`
- [ ] `extensions/checkout-address-autocomplete/package.json`
- [ ] `PHASE_2_CHECKOUT_IMPLEMENTATION.md`
- [ ] `PHASE_2_QUICK_START.md`
- [ ] `PHASE_2_TESTING_CHECKLIST.md`
- [ ] `PHASE_2_IMPLEMENTATION_SUMMARY.md`

**Modified Files (3):**
- [ ] `app/routes/api.address-autocomplete.search.tsx` (context checks added)
- [ ] `extensions/address-autocomplete/assets/address-autocomplete.js` (context param added)
- [ ] `README.md` (Phase 2 section added)

**Unchanged Files (still working):**
- ✅ `app/routes/app.address-autocomplete.tsx` (settings page)
- ✅ `prisma/schema.prisma` (database schema)
- ✅ `extensions/address-autocomplete/blocks/app-embed.liquid` (profile embed)
- ✅ All other Phase 1 files

---

**All files documented! Ready to deploy! 🚀**

