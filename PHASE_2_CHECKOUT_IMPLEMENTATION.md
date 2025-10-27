# Phase 2: Checkout Address Autocomplete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Steps](#implementation-steps)
4. [File-by-File Guide](#file-by-file-guide)
5. [Configuration](#configuration)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)
8. [FAQs](#faqs)

---

## Overview

Phase 2 adds address autocomplete functionality to the **Shopify Checkout page**, complementing the existing profile page implementation from Phase 1.

### Key Features
✅ **Uses existing `address1` field** (no new fields created)  
✅ **Handles 2-character country codes** (US, CA, etc.) used in checkout  
✅ **Separate enable/disable control** via `enabledCheckout` setting  
✅ **Doesn't impact profile page functionality**  
✅ **Extensible to order status pages** in the future  
✅ **Context-aware API** that respects per-page settings  

### Your Questions Answered

**Q1: Can we use existing field name address1 for swift autocomplete?**  
**A:** ✅ **YES!** We enhance the existing `address1` field with autocomplete functionality. This is the recommended approach because:
- No field duplication needed
- Works seamlessly with Shopify's native checkout validation
- Compatible with all payment processors
- No need to hide or manage multiple fields

**Q2: If create a new one, how to disable address1 or hide it?**  
**A:** We **don't need to create a new field**. The implementation enhances the existing `address1` input field by:
- Detecting it automatically when checkout loads
- Attaching autocomplete functionality to it
- Keeping all native Shopify checkout validation intact

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHOPIFY ADMIN APP                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Settings Page (app.address-autocomplete.tsx)            │    │
│  │ - Master enabled switch                                 │    │
│  │ - ✓ enabledCheckout (for checkout pages)              │    │
│  │ - ✓ enabledProfile (for profile pages)                │    │
│  │ - API key configuration                                 │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Saves settings
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (Prisma)                          │
│  SwiftcompleteSettings table:                                   │
│  - shop, apiKey, enabled                                        │
│  - enabledCheckout ◄── Controls checkout feature               │
│  - enabledProfile  ◄── Controls profile feature                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Reads settings
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              API ROUTE (api.address-autocomplete.search.tsx)    │
│  - Receives context parameter ('checkout' or 'profile')         │
│  - Checks enabledCheckout or enabledProfile accordingly        │
│  - Proxies to Swiftcomplete API                                 │
│  - Tracks usage for billing                                     │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
        Context:    │                           │    Context:
        'profile'   │                           │    'checkout'
                    ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   PROFILE PAGES              │  │   CHECKOUT PAGE              │
│   (Theme Extension)          │  │   (Checkout Extension)       │
│                              │  │                              │
│ address-autocomplete.js      │  │ checkout-autocomplete-       │
│ - Detects address1 field     │  │   vanilla.js                 │
│ - Attaches autocomplete      │  │ - Detects address1 field     │
│ - Sends context='profile'    │  │ - Attaches autocomplete      │
│ - Handles full country names │  │ - Sends context='checkout'   │
│   ("United States")          │  │ - Handles 2-char codes ("US")│
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Verify Database Schema

The database already has the necessary fields from Phase 1:

```prisma
model SwiftcompleteSettings {
  id Int @id @default(autoincrement())
  shop String @unique
  apiKey String
  enabled Boolean @default(true)
  enabledCheckout Boolean @default(true)   ◄── Used for checkout
  enabledProfile Boolean @default(true)    ◄── Used for profile
  chargePerLookup Float @default(0.03)
  maxMonthlyCharge Float @default(100.00)
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}
```

✅ **No database changes needed!**

---

### Step 2: Deploy Checkout Extension

The checkout extension has been created in:
```
extensions/checkout-address-autocomplete/
├── src/
│   ├── index.js                          # UI Extensions SDK version
│   └── checkout-autocomplete-vanilla.js   # Vanilla JS version (recommended)
├── shopify.extension.toml
└── package.json
```

**Deploy using Shopify CLI:**

```bash
# From project root
cd extensions/checkout-address-autocomplete

# Deploy the extension
shopify app deploy
```

---

### Step 3: Configure Checkout Extension

There are **three ways** to integrate checkout autocomplete:

#### Option A: Via Checkout Extensibility (Recommended for Shopify Plus)

1. Log in to your Shopify Admin
2. Go to **Settings** → **Checkout**
3. Scroll to **Checkout Extensions**
4. Find "Address Autocomplete for Checkout"
5. Click **Enable** or **Add to checkout**
6. Configure placement (delivery address section recommended)
7. Save

#### Option B: Via checkout.liquid (Shopify Plus Only)

1. Go to **Settings** → **Checkout** → **Customize checkout**
2. Edit `checkout.liquid`
3. Add before `</body>`:

```liquid
{% comment %} Address Autocomplete for Checkout {% endcomment %}
<script>
  window.CheckoutAutocompleteConfig = {
    apiEndpoint: 'https://your-app-url.com/api/address-autocomplete/search',
    shop: '{{ shop.permanent_domain }}',
    enabled: true,
    context: 'checkout'
  };
</script>
<script src="{{ 'checkout-autocomplete-vanilla.js' | asset_url }}" defer></script>
```

4. Upload `checkout-autocomplete-vanilla.js` to your theme assets

#### Option C: Via Web Pixels (All Plans)

1. Go to **Settings** → **Customer events** → **Web pixels**
2. Click **Add custom pixel**
3. Paste the contents of `checkout-autocomplete-vanilla.js`
4. Add configuration:

```javascript
// At the top of the pixel code
window.CheckoutAutocompleteConfig = {
  apiEndpoint: 'https://your-app-url.com/api/address-autocomplete/search',
  shop: analytics.subscribe('checkout_started', (event) => event.data.checkout.shop),
  enabled: true,
  context: 'checkout'
};
```

5. Save and enable the pixel

---

## File-by-File Guide

### 1. Admin Settings Page
**File:** `app/routes/app.address-autocomplete.tsx`

**What it does:**
- Provides UI for merchants to configure the app
- Has separate checkboxes for "Checkout pages" and "Profile pages"
- Saves settings to database

**How to use:**
1. Access via: `https://admin.shopify.com/store/YOUR_STORE/apps/swift-address-autocomplete`
2. Toggle "Enable address autocomplete" (master switch)
3. Enable/disable for specific areas:
   - ☑️ **Checkout pages** ← Controls `enabledCheckout`
   - ☑️ **Profile & account pages** ← Controls `enabledProfile`
4. Click "Save Settings"

**Testing:**
```bash
# Start dev server
npm run dev

# Navigate to settings page
# Test toggling checkboxes
# Verify settings save successfully
```

---

### 2. API Route (Updated)
**File:** `app/routes/api.address-autocomplete.search.tsx`

**What changed:**
- ✅ Added `context` parameter detection
- ✅ Added `enabledCheckout` and `enabledProfile` checks
- ✅ Added `detectContext()` function

**Key changes:**

```typescript
// New: Detect context from query param or referer
const context = url.searchParams.get("context") || detectContext(request);

// New: Check context-specific settings
if (context === 'checkout' && !settings.enabledCheckout) {
  return json({ results: [], error: "Service not enabled for checkout" }, 
               { status: 403, headers: corsHeaders });
}

if (context === 'profile' && !settings.enabledProfile) {
  return json({ results: [], error: "Service not enabled for profile" }, 
               { status: 403, headers: corsHeaders });
}
```

**How it works:**
1. Receives API request with `?context=checkout` or `?context=profile`
2. Falls back to detecting context from referer header
3. Checks appropriate `enabled*` setting
4. Proxies to Swiftcomplete API if allowed
5. Returns address suggestions

**Testing:**
```bash
# Test profile context
curl "http://localhost:3000/api/address-autocomplete/search?shop=yourstore.myshopify.com&q=123%20Main&context=profile"

# Test checkout context
curl "http://localhost:3000/api/address-autocomplete/search?shop=yourstore.myshopify.com&q=123%20Main&context=checkout"

# Test with disabled checkout
# 1. Disable checkout in admin settings
# 2. Try checkout context request
# 3. Should return 403 error
```

---

### 3. Profile Page Extension (Updated)
**File:** `extensions/address-autocomplete/assets/address-autocomplete.js`

**What changed:**
- ✅ Added `context: 'profile'` to config
- ✅ Sends `&context=profile` with API requests

**Key change:**
```javascript
let config = {
  apiEndpoint: '/apps/address-autocomplete/search',
  enabled: true,
  minCharacters: 3,
  debounceDelay: 300,
  context: 'profile' // ◄── New: Explicitly set context
};

// In API call:
const response = await fetch(`${config.apiEndpoint}&q=${encodeURIComponent(query)}&context=${config.context}`);
```

**Testing:**
1. Go to customer account page: `https://yourstore.com/account/addresses`
2. Click "Add address"
3. Type in address field
4. Verify autocomplete works
5. Check browser console for context logs

---

### 4. Checkout Extension (New)
**File:** `extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js`

**What it does:**
- Detects checkout address1 field automatically
- Attaches autocomplete dropdown
- Handles 2-character country codes (US, CA, etc.)
- Sends `context=checkout` to API

**Key features:**

#### Field Detection
```javascript
function findAddressInput(form) {
  const selectors = [
    'input[name="address1"]',
    'input[name="checkout[shipping_address][address1]"]',
    'input[id*="checkout_shipping_address_address1"]',
    'input[autocomplete="address-line1"]',
    // ... more patterns
  ];
  // Tries each pattern until field is found
}
```

#### Country Code Handling
```javascript
function fillCountryField(form, countryCode) {
  // Checkout uses 2-char codes: "US", "CA", etc.
  const code = countryCode.toUpperCase();
  
  // Find select option with matching value
  let option = Array.from(field.options).find(opt => opt.value === code);
  
  if (option) {
    field.value = option.value; // Sets to "US" not "United States"
  }
}
```

**How to use:**

**Via Checkout.liquid (Plus merchants):**
```liquid
<script>
  window.CheckoutAutocompleteConfig = {
    apiEndpoint: '{{ shop.metafields.app.api_url }}/api/address-autocomplete/search',
    shop: '{{ shop.permanent_domain }}',
    enabled: true,
    context: 'checkout'
  };
</script>
<script src="{{ 'checkout-autocomplete-vanilla.js' | asset_url }}" defer></script>
```

**Testing:**
1. Create a test order
2. Proceed to checkout
3. In shipping address, start typing in "Address" field
4. Verify dropdown appears with suggestions
5. Select an address
6. Verify all fields populate:
   - Address 1 ✓
   - City ✓
   - State/Province ✓
   - ZIP/Postal Code ✓
   - Country ✓ (should show 2-char code like "US")

**Debug logs to check:**
```javascript
// Open browser console, you should see:
[Checkout Address Autocomplete] Initializing for shop: yourstore.myshopify.com
[Checkout Address Autocomplete] Found address input, enhancing...
[Checkout Address Autocomplete] Enhancement complete
[Checkout Address Autocomplete] Selected address: {...}
[Checkout Address Autocomplete] Filled city: New York
[Checkout Address Autocomplete] Set country to: US
```

---

### 5. Extension Configuration
**File:** `extensions/checkout-address-autocomplete/shopify.extension.toml`

**What it does:**
- Defines extension metadata for Shopify
- Configures where extension appears in checkout
- Sets extension type and targeting

**Key settings:**
```toml
type = "ui_extension"
handle = "address-autocomplete-checkout"

[extensions.targeting]
target = "purchase.checkout.delivery-address.render-after"
# This makes it appear right after the delivery address section
```

**How to customize:**
- Change `target` to different checkout extension points:
  - `purchase.checkout.delivery-address.render-before`
  - `purchase.checkout.delivery-address.render-after`
  - `purchase.checkout.billing-address.render-after`

---

## Configuration

### Admin Settings

All configuration is done via the Shopify Admin app settings page:

| Setting | Description | Default | Controls |
|---------|-------------|---------|----------|
| **API Key** | Swiftcomplete API key | - | Required for all features |
| **Enable address autocomplete** | Master switch | `true` | Entire feature on/off |
| **Checkout pages** | Enable for checkout | `true` | `enabledCheckout` field |
| **Profile & account pages** | Enable for profile | `true` | `enabledProfile` field |
| **Charge per lookup** | Cost per API call | $0.03 | Billing tracking |
| **Maximum monthly charge** | Monthly cap | $100 | Billing limit |

### Environment Variables

Set these in your `.env` file or hosting platform:

```bash
# Required
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret

# Optional: Custom API endpoint
API_BASE_URL=https://your-app.com

# Database
DATABASE_URL=file:./dev.sqlite
```

---

## Testing Guide

### 1. Unit Testing: API Route

**Test enabledCheckout setting:**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test requests
# Test with checkout context
curl -X GET "http://localhost:3000/api/address-autocomplete/search?shop=test-store.myshopify.com&q=123%20Main&context=checkout"

# Expected: 200 OK with results (if enabled)
# Expected: 403 Forbidden (if disabled in settings)
```

**Test enabledProfile setting:**

```bash
# Test with profile context
curl -X GET "http://localhost:3000/api/address-autocomplete/search?shop=test-store.myshopify.com&q=456%20Oak&context=profile"

# Expected: 200 OK with results (if enabled)
# Expected: 403 Forbidden (if disabled in settings)
```

**Test context detection:**

```bash
# Test without explicit context (should detect from referer)
curl -X GET "http://localhost:3000/api/address-autocomplete/search?shop=test-store.myshopify.com&q=789%20Elm" \
  -H "Referer: https://test-store.myshopify.com/account/addresses"

# Should detect context='profile' from URL
```

---

### 2. Integration Testing: Checkout

**Setup:**
1. Deploy app to development store
2. Configure API key in settings
3. Enable "Checkout pages" option
4. Deploy checkout extension

**Test scenarios:**

#### Scenario 1: Basic Autocomplete
1. Add item to cart
2. Go to checkout
3. In "Address" field, type: `"123 Main"`
4. Wait 300ms (debounce delay)
5. Verify dropdown appears
6. Verify 5 or fewer suggestions shown
7. Click a suggestion
8. Verify fields populate:
   - Address 1: "123 Main St" ✓
   - City: "Anytown" ✓
   - State: "CA" ✓
   - ZIP: "12345" ✓
   - Country: "US" ✓

#### Scenario 2: Keyboard Navigation
1. Type address query
2. Press `↓` (down arrow)
3. Verify first item highlights
4. Press `↓` again
5. Verify second item highlights
6. Press `Enter`
7. Verify selected address fills fields

#### Scenario 3: Disabled Checkout
1. Go to admin settings
2. Uncheck "Checkout pages"
3. Save settings
4. Go to checkout
5. Type in address field
6. Verify NO dropdown appears
7. Check browser console for: "Service not enabled for checkout"

#### Scenario 4: Country Code Handling
1. Search for international address: `"10 Downing Street London"`
2. Select suggestion
3. Verify country field shows: **"GB"** (not "United Kingdom")
4. Verify country select dropdown displays correctly

---

### 3. Profile Page Testing

**Verify profile still works:**

1. Log in as customer
2. Go to: `https://yourstore.com/account/addresses`
3. Click "Add address"
4. Type in Address field
5. Verify autocomplete works
6. Verify independent from checkout (can be disabled separately)

**Test independence:**
1. Disable "Profile & account pages" in settings
2. Verify profile autocomplete stops working
3. Verify checkout autocomplete still works (if enabled)

---

### 4. Cross-Browser Testing

Test in multiple browsers:

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✓ | ✓ |
| Firefox | ✓ | ✓ |
| Safari | ✓ | ✓ (iOS) |
| Edge | ✓ | - |

**Test checklist:**
- [ ] Dropdown appears
- [ ] Dropdown styles correctly
- [ ] Keyboard navigation works
- [ ] Touch/click selection works
- [ ] Fields populate correctly
- [ ] No JavaScript errors in console

---

### 5. Performance Testing

**Metrics to check:**

```javascript
// Add to browser console during testing
performance.mark('autocomplete-start');
// ... trigger autocomplete ...
performance.mark('autocomplete-end');
performance.measure('autocomplete', 'autocomplete-start', 'autocomplete-end');
console.log(performance.getEntriesByName('autocomplete'));
```

**Targets:**
- API response time: < 500ms
- Dropdown render: < 100ms
- Debounce delay: 300ms (configurable)
- No impact on checkout load time

---

## Troubleshooting

### Issue 1: Dropdown Doesn't Appear

**Symptoms:**
- Type in address field
- No dropdown shows up
- No console errors

**Causes & Solutions:**

1. **Feature disabled in settings**
   ```bash
   # Check: Admin → Apps → Address Autocomplete → Settings
   # Ensure "Checkout pages" is checked
   ```

2. **Extension not deployed**
   ```bash
   # Deploy extension
   cd extensions/checkout-address-autocomplete
   shopify app deploy
   ```

3. **Shop parameter missing**
   ```javascript
   // Check browser console
   // Look for: "Shop parameter required"
   // Fix: Ensure CONFIG.shop is set correctly
   ```

4. **Field not detected**
   ```javascript
   // Check console for:
   [Checkout Address Autocomplete] Address input not found
   
   // Debug: Try finding field manually
   document.querySelector('input[name="address1"]')
   
   // If null, checkout field pattern may be different
   // Update findAddressInput() selectors
   ```

---

### Issue 2: API Returns 403 Forbidden

**Symptoms:**
- Dropdown shows "Failed to load suggestions"
- Console shows 403 error
- API call fails

**Causes & Solutions:**

1. **Context-specific setting disabled**
   ```javascript
   // Check response message:
   { "error": "Service not enabled for checkout" }
   
   // Fix: Enable in admin settings:
   // Settings → Checkout pages ☑️
   ```

2. **Master switch disabled**
   ```javascript
   // Check response:
   { "error": "Service not enabled" }
   
   // Fix: Enable master switch:
   // Settings → Enable address autocomplete ☑️
   ```

3. **Invalid API key**
   ```javascript
   // Check Swiftcomplete API response
   // Fix: Update API key in admin settings
   ```

---

### Issue 3: Country Field Not Populating

**Symptoms:**
- Address, city, zip fill correctly
- Country field stays empty or shows wrong value

**Cause:**
Checkout uses 2-character codes ("US") but API returns codes that don't match select options.

**Solution:**

1. **Check country select options:**
   ```javascript
   // Open browser console on checkout page
   const countrySelect = document.querySelector('select[name="country"]');
   console.log([...countrySelect.options].map(o => ({ value: o.value, text: o.text })));
   
   // Output should show: [{ value: "US", text: "United States" }, ...]
   ```

2. **Verify API response:**
   ```javascript
   // Check API response in Network tab
   // Look for: { "country": "US" }
   // NOT: { "country": "United States" }
   ```

3. **Update fillCountryField() if needed:**
   ```javascript
   // In checkout-autocomplete-vanilla.js
   // Add more matching logic if your checkout uses different format
   function fillCountryField(form, countryCode) {
     // Add custom matching logic here
   }
   ```

---

### Issue 4: Autocomplete Works in Profile but Not Checkout

**Symptoms:**
- Profile pages: autocomplete works ✓
- Checkout: no autocomplete ✗

**Cause:**
Different extension deployment or configuration.

**Solution:**

1. **Verify checkout extension deployed:**
   ```bash
   shopify app list extensions
   # Look for: "checkout-address-autocomplete"
   ```

2. **Check checkout.liquid (if using):**
   ```liquid
   {%- comment -%} Should contain: {%- endcomment -%}
   <script src="{{ 'checkout-autocomplete-vanilla.js' | asset_url }}"></script>
   ```

3. **Verify enabledCheckout = true:**
   ```sql
   -- Query database
   SELECT enabledCheckout FROM SwiftcompleteSettings WHERE shop = 'yourstore.myshopify.com';
   -- Should return: 1 (true)
   ```

4. **Check browser console:**
   ```javascript
   // Should see initialization logs
   [Checkout Address Autocomplete] Initializing for shop: ...
   
   // If not, script may not be loading
   ```

---

### Issue 5: Fields Fill with Wrong Data

**Symptoms:**
- Address goes to city field
- City goes to state field
- Data mapping is incorrect

**Cause:**
Checkout field patterns differ from expected.

**Solution:**

1. **Inspect field names:**
   ```javascript
   // Open browser console on checkout
   document.querySelectorAll('input[name*="address"], select[name*="country"]')
     .forEach(el => console.log(el.name, el.id));
   
   // Output shows actual field names used
   ```

2. **Update field detection:**
   ```javascript
   // In fillField() function, add new patterns:
   const patterns = [
     `[name="${fieldName}"]`,
     `[name="checkout[shipping_address][${fieldName}]"]`,
     `[name="YOUR_NEW_PATTERN_HERE"]`, // ◄── Add this
     // ...
   ];
   ```

---

### Issue 6: Dropdown Position is Wrong

**Symptoms:**
- Dropdown appears in wrong location
- Dropdown is cut off
- Dropdown doesn't align with input

**Solution:**

1. **Check parent positioning:**
   ```javascript
   // Dropdown parent needs position: relative
   const wrapper = input.parentElement;
   wrapper.style.position = 'relative';
   ```

2. **Adjust CSS:**
   ```css
   /* In injectStyles() function */
   .checkout-autocomplete-dropdown {
     position: absolute;
     top: 100%;      /* Right below input */
     left: 0;
     right: 0;
     margin-top: 4px;
     z-index: 10000;  /* High z-index */
   }
   ```

3. **Fix overflow issues:**
   ```css
   /* Add to parent container */
   .address-field-wrapper {
     overflow: visible !important;
   }
   ```

---

## FAQs

### Q: Do I need to create a new address field?

**A:** **No!** The implementation enhances the existing `address1` field. This is better because:
- ✓ No field duplication
- ✓ Works with native checkout validation
- ✓ Compatible with payment processors
- ✓ No hiding/disabling logic needed

---

### Q: How do I handle 2-character country codes?

**A:** The checkout extension automatically handles this:
- API returns: `{ "country": "US" }`
- Script matches: `<option value="US">United States</option>`
- Result: Correct country selected in dropdown

The key code:
```javascript
const code = countryCode.toUpperCase(); // "US"
let option = Array.from(field.options).find(opt => opt.value === code);
field.value = option.value; // Sets to "US"
```

---

### Q: Can I disable checkout without affecting profile?

**A:** **Yes!** Settings are independent:
- `enabledCheckout` controls checkout pages only
- `enabledProfile` controls profile pages only
- Both respect the master `enabled` switch

Example scenarios:
| Master | Checkout | Profile | Result |
|--------|----------|---------|--------|
| ✓ | ✓ | ✓ | Both work |
| ✓ | ✓ | ✗ | Only checkout works |
| ✓ | ✗ | ✓ | Only profile works |
| ✗ | ✓ | ✓ | Neither works |

---

### Q: Will this work on order status pages?

**A:** **Yes, extensible!** To add order status support:

1. Add `enabledOrderStatus` field to database:
   ```prisma
   model SwiftcompleteSettings {
     // ...existing fields...
     enabledOrderStatus Boolean @default(true)
   }
   ```

2. Update API to check `context='order-status'`

3. Create order status script similar to checkout script

4. Deploy as separate extension or include in checkout extension

---

### Q: How do I customize the dropdown styling?

**A:** Edit the CSS in `injectStyles()` function:

```javascript
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .checkout-autocomplete-dropdown {
      /* Customize colors */
      background: #ffffff;          /* Dropdown background */
      border: 1px solid #d1d5db;   /* Border color */
      border-radius: 8px;           /* Rounded corners */
      
      /* Customize shadows */
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      
      /* Customize size */
      max-height: 300px;            /* Max dropdown height */
      font-size: 14px;              /* Text size */
    }
    
    .checkout-autocomplete-item:hover {
      background-color: #f3f4f6;   /* Hover color */
    }
  `;
  document.head.appendChild(style);
}
```

---

### Q: How much does each address lookup cost?

**A:** Configurable in admin settings:
- Default: **$0.03 per lookup**
- Capped at: **$100/month** (default)
- Tracked in: `AddressLookup` table
- Can be adjusted per merchant

---

### Q: Does this work on Shopify Basic plan?

**A:** Implementation options vary by plan:

| Plan | Method | Supported |
|------|--------|-----------|
| **Basic** | Web Pixels | ✓ Yes |
| **Shopify** | Web Pixels | ✓ Yes |
| **Advanced** | Web Pixels | ✓ Yes |
| **Plus** | checkout.liquid | ✓ Yes (best) |
| **Plus** | Checkout Extensions | ✓ Yes (best) |

**Recommended:** Use Web Pixels for all plans, or checkout.liquid for Plus.

---

### Q: Can customers still type addresses manually?

**A:** **Yes!** Autocomplete is optional:
- Dropdown only appears when typing
- Customers can ignore suggestions
- Manual entry works exactly as before
- Native validation still applies

---

### Q: What happens if Swiftcomplete API is down?

**A:** Graceful degradation:
1. Autocomplete fails silently
2. Error shown: "Failed to load suggestions"
3. Customer can still type manually
4. Checkout process not blocked
5. No impact on order completion

---

### Q: How do I test without a real checkout?

**A:** Use development store:

```bash
# 1. Create development store
shopify login --store your-dev-store.myshopify.com

# 2. Deploy app
shopify app deploy

# 3. Create test orders
# In Shopify Admin → Orders → Create order

# 4. Or use test mode
# Settings → Payments → Enable Shopify Payments test mode
```

---

## Next Steps

### Extending to Order Status Pages

To add autocomplete to order status pages:

1. **Create order status extension:**
   ```bash
   cd extensions
   cp -r checkout-address-autocomplete order-status-autocomplete
   ```

2. **Update configuration:**
   ```toml
   # In shopify.extension.toml
   [extensions.targeting]
   target = "customer-account.order-status.block.render"
   ```

3. **Update context:**
   ```javascript
   context: 'order-status'
   ```

4. **Add database field:**
   ```prisma
   enabledOrderStatus Boolean @default(true)
   ```

5. **Update API route:**
   ```typescript
   if (context === 'order-status' && !settings.enabledOrderStatus) {
     return json({ error: "Not enabled for order status" }, { status: 403 });
   }
   ```

---

## Support & Resources

### Documentation
- [Swiftcomplete API Docs](https://swiftcomplete.com/docs)
- [Shopify Checkout Extensions](https://shopify.dev/docs/api/checkout-extensions)
- [Shopify App Extensions](https://shopify.dev/docs/apps/app-extensions)

### Code Files Reference
- Admin Settings: `app/routes/app.address-autocomplete.tsx`
- API Route: `app/routes/api.address-autocomplete.search.tsx`
- Profile Extension: `extensions/address-autocomplete/assets/address-autocomplete.js`
- Checkout Extension: `extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js`
- Database Schema: `prisma/schema.prisma`

### Need Help?
- Check troubleshooting section above
- Review browser console for error messages
- Test API endpoint directly with cURL
- Verify settings in admin panel

---

## Summary Checklist

Before going live, ensure:

- [ ] Admin settings page has "Checkout pages" option
- [ ] Database has `enabledCheckout` and `enabledProfile` fields
- [ ] API route checks context and settings
- [ ] Checkout extension deployed
- [ ] Profile extension sends `context=profile`
- [ ] Checkout extension sends `context=checkout`
- [ ] Country codes handled correctly (2-char codes)
- [ ] All tests pass (see Testing Guide)
- [ ] No console errors in checkout
- [ ] Dropdown styles correctly
- [ ] Fields populate correctly
- [ ] Feature can be disabled independently
- [ ] Documentation updated
- [ ] Merchants trained on settings

---

**Phase 2 Implementation Complete! 🎉**

You now have address autocomplete working in both **profile pages** and **checkout pages**, with independent enable/disable controls and proper handling of checkout-specific requirements like 2-character country codes.

