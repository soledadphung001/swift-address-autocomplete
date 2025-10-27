# Phase 2: Testing Checklist

## Pre-Deployment Tests

### 1. Admin Settings Page
- [ ] Page loads without errors
- [ ] "Checkout pages" checkbox is visible
- [ ] "Profile & account pages" checkbox is visible
- [ ] Both checkboxes can be toggled independently
- [ ] Master "Enable address autocomplete" affects both
- [ ] Settings save successfully
- [ ] Success banner shows after save
- [ ] Refresh page shows saved values

### 2. API Route Tests

#### Test Context Detection
```bash
# Test profile context (explicit)
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=profile"
# Expected: 200 OK with results (if enabledProfile=true)

# Test checkout context (explicit)
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=checkout"
# Expected: 200 OK with results (if enabledCheckout=true)

# Test context detection from referer
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main" \
  -H "Referer: https://test.myshopify.com/checkout/123"
# Expected: Detects context=checkout
```

#### Test Settings Enforcement
```bash
# 1. Disable "Checkout pages" in admin
# 2. Test checkout context
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=checkout"
# Expected: 403 Forbidden
# Expected: {"error": "Service not enabled for checkout"}

# 3. Enable "Checkout pages", disable "Profile pages"
# 4. Test profile context
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=profile"
# Expected: 403 Forbidden
# Expected: {"error": "Service not enabled for profile"}
```

#### Test Query Validation
```bash
# Test short query
curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=12&context=checkout"
# Expected: 400 Bad Request
# Expected: {"error": "Query too short"}

# Test missing shop
curl "http://localhost:3000/api/address-autocomplete/search?q=123%20Main&context=checkout"
# Expected: 400 Bad Request
# Expected: {"error": "Shop parameter required"}
```

---

## Checkout Page Tests

### 3. Extension Deployment
- [ ] Extension deploys without errors: `shopify app deploy`
- [ ] Extension appears in: Settings → Checkout → Extensions
- [ ] Extension can be enabled/disabled in checkout editor
- [ ] Extension shows in correct position (after delivery address)

### 4. Basic Autocomplete Functionality

#### Test: Dropdown Appears
1. [ ] Add item to cart
2. [ ] Go to checkout
3. [ ] Click in "Address" field
4. [ ] Type: `"123 Main"`
5. [ ] Wait 300ms
6. [ ] Dropdown appears below field
7. [ ] Shows 5 or fewer suggestions
8. [ ] Each suggestion has:
   - [ ] Main text (address)
   - [ ] Sub text (city, state, zip, country)

#### Test: Select Address
1. [ ] Click on a suggestion
2. [ ] Dropdown closes
3. [ ] Address 1 field fills with street address
4. [ ] City field fills
5. [ ] State/Province field fills
6. [ ] ZIP/Postal Code field fills
7. [ ] Country field fills with 2-char code (e.g., "US")

#### Test: Keyboard Navigation
1. [ ] Type address query
2. [ ] Press `↓` (down arrow)
3. [ ] First item highlights
4. [ ] Press `↓` again
5. [ ] Second item highlights
6. [ ] Press `↑` (up arrow)
7. [ ] First item highlights again
8. [ ] Press `Enter`
9. [ ] Selected address fills fields
10. [ ] Dropdown closes

#### Test: Escape Key
1. [ ] Type address query
2. [ ] Dropdown appears
3. [ ] Press `Esc`
4. [ ] Dropdown closes
5. [ ] Input retains typed text

#### Test: Blur Event
1. [ ] Type address query
2. [ ] Dropdown appears
3. [ ] Click outside input (e.g., on city field)
4. [ ] Dropdown closes after 200ms

### 5. Country Code Handling

#### Test: US Address
1. [ ] Type: `"1600 Pennsylvania Avenue"`
2. [ ] Select: "1600 Pennsylvania Ave NW, Washington, DC"
3. [ ] Verify country field shows: `"US"` (not "United States")
4. [ ] Verify country dropdown displays: "United States"

#### Test: Canadian Address
1. [ ] Type: `"24 Sussex Drive Ottawa"`
2. [ ] Select suggestion
3. [ ] Verify country field shows: `"CA"` (not "Canada")
4. [ ] Verify country dropdown displays: "Canada"

#### Test: UK Address
1. [ ] Type: `"10 Downing Street London"`
2. [ ] Select suggestion
3. [ ] Verify country field shows: `"GB"` (not "United Kingdom")
4. [ ] Verify country dropdown displays: "United Kingdom"

### 6. Edge Cases

#### Test: No Results
1. [ ] Type: `"asdfasdfasdf"`
2. [ ] Wait for API response
3. [ ] Dropdown shows: "No addresses found"
4. [ ] No errors in console

#### Test: API Error
1. [ ] Disconnect from internet (or block API in DevTools)
2. [ ] Type: `"123 Main"`
3. [ ] Dropdown shows: "Failed to load suggestions"
4. [ ] Console shows error (but not thrown)
5. [ ] Can still type address manually

#### Test: Short Query
1. [ ] Type: `"12"` (2 characters)
2. [ ] Dropdown does NOT appear
3. [ ] Type: `"3"` (now 3 characters)
4. [ ] After 300ms, dropdown appears

#### Test: Rapid Typing
1. [ ] Type quickly: `"123 Main Street"`
2. [ ] Only ONE API request sent (debounced)
3. [ ] Dropdown appears after last keystroke + 300ms

### 7. Settings Integration

#### Test: Disable Checkout
1. [ ] Go to admin settings
2. [ ] Uncheck "Checkout pages"
3. [ ] Save settings
4. [ ] Go to checkout
5. [ ] Type in address field
6. [ ] Dropdown does NOT appear
7. [ ] Console shows: "Service not enabled for checkout"

#### Test: Disable Master Switch
1. [ ] Uncheck "Enable address autocomplete"
2. [ ] Save settings
3. [ ] Go to checkout
4. [ ] Type in address field
5. [ ] Dropdown does NOT appear

#### Test: Re-enable
1. [ ] Re-check both settings
2. [ ] Save settings
3. [ ] Go to checkout
4. [ ] Type in address field
5. [ ] Dropdown appears again

---

## Profile Page Tests

### 8. Profile Page Independence

#### Test: Profile Still Works
1. [ ] Enable "Profile & account pages" in settings
2. [ ] Go to: `/account/addresses`
3. [ ] Click "Add address"
4. [ ] Type in Address field
5. [ ] Dropdown appears
6. [ ] Select address
7. [ ] Fields fill correctly
8. [ ] Country field shows FULL name (e.g., "United States")

#### Test: Disable Profile, Checkout Still Works
1. [ ] Disable "Profile & account pages"
2. [ ] Keep "Checkout pages" enabled
3. [ ] Save settings
4. [ ] Go to profile `/account/addresses`
5. [ ] Type in address field
6. [ ] Dropdown does NOT appear
7. [ ] Go to checkout
8. [ ] Type in address field
9. [ ] Dropdown DOES appear ✓

#### Test: Disable Checkout, Profile Still Works
1. [ ] Enable "Profile & account pages"
2. [ ] Disable "Checkout pages"
3. [ ] Save settings
4. [ ] Go to checkout
5. [ ] Type in address field
6. [ ] Dropdown does NOT appear
7. [ ] Go to profile
8. [ ] Type in address field
9. [ ] Dropdown DOES appear ✓

---

## Browser Compatibility Tests

### 9. Desktop Browsers

#### Chrome
- [ ] Dropdown appears
- [ ] Styles correctly
- [ ] Selection works
- [ ] Keyboard navigation works
- [ ] No console errors

#### Firefox
- [ ] Dropdown appears
- [ ] Styles correctly
- [ ] Selection works
- [ ] Keyboard navigation works
- [ ] No console errors

#### Safari
- [ ] Dropdown appears
- [ ] Styles correctly
- [ ] Selection works
- [ ] Keyboard navigation works
- [ ] No console errors

#### Edge
- [ ] Dropdown appears
- [ ] Styles correctly
- [ ] Selection works
- [ ] Keyboard navigation works
- [ ] No console errors

### 10. Mobile Browsers

#### Chrome Mobile (Android)
- [ ] Dropdown appears
- [ ] Touch selection works
- [ ] Dropdown scrolls correctly
- [ ] Virtual keyboard doesn't cover dropdown
- [ ] Responsive styles apply

#### Safari Mobile (iOS)
- [ ] Dropdown appears
- [ ] Touch selection works
- [ ] Dropdown scrolls correctly
- [ ] Virtual keyboard doesn't cover dropdown
- [ ] Responsive styles apply

---

## Performance Tests

### 11. Performance Metrics

#### API Response Time
```javascript
// In browser console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('address-autocomplete'))
  .map(r => ({ url: r.name, duration: r.duration }))

// Target: < 500ms
```
- [ ] First request: < 500ms
- [ ] Subsequent requests: < 300ms

#### Dropdown Render Time
```javascript
// Add to code temporarily
console.time('dropdown-render');
displayResults(dropdown, results, input);
console.timeEnd('dropdown-render');

// Target: < 100ms
```
- [ ] Rendering 5 items: < 100ms

#### Debounce Delay
- [ ] Set to: 300ms (CONFIG.debounceDelay)
- [ ] Type 5 characters rapidly
- [ ] Only 1 API call made
- [ ] API call happens 300ms after last keystroke

### 12. Load Impact

#### Checkout Load Time
```javascript
// In browser console on checkout
performance.timing.loadEventEnd - performance.timing.navigationStart
```
- [ ] Without extension: X ms
- [ ] With extension: X + <50 ms
- [ ] Extension adds < 50ms to page load

#### Resource Size
```bash
# Check file sizes
ls -lh extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js
# Should be: < 20KB
```
- [ ] JavaScript file: < 20KB
- [ ] No external dependencies
- [ ] Loads asynchronously (defer)

---

## Security Tests

### 13. XSS Prevention

#### Test: Malicious Input
1. [ ] Type: `<script>alert('XSS')</script> Main St`
2. [ ] Select result
3. [ ] No alert fires
4. [ ] Script tags rendered as text
5. [ ] Console shows no errors

#### Test: HTML Injection in Results
1. [ ] Mock API response with HTML:
   ```json
   {"address": "<img src=x onerror=alert('XSS')>"}
   ```
2. [ ] Dropdown renders safely
3. [ ] No alert fires
4. [ ] HTML escaped: `&lt;img src=x...`

### 14. CORS Headers

```bash
# Test CORS
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     "http://localhost:3000/api/address-autocomplete/search"
```
- [ ] Returns CORS headers
- [ ] Allows all origins (public API)

---

## Accessibility Tests

### 15. Keyboard Accessibility

- [ ] Can tab to address field
- [ ] Can type without mouse
- [ ] Arrow keys navigate suggestions
- [ ] Enter key selects
- [ ] Escape key closes dropdown
- [ ] Can complete checkout without mouse

### 16. Screen Reader Support

#### NVDA/JAWS (Windows)
- [ ] Announces field label
- [ ] Announces "Loading" state
- [ ] Announces number of results
- [ ] Reads selected option
- [ ] Announces field values after selection

#### VoiceOver (Mac/iOS)
- [ ] Announces field label
- [ ] Announces dropdown appearance
- [ ] Reads result items
- [ ] Announces selection

### 17. Visual Accessibility

- [ ] Dropdown has sufficient contrast (WCAG AA)
- [ ] Hover state is visible
- [ ] Active/selected state is clear
- [ ] Text is readable at 200% zoom
- [ ] Works with Windows High Contrast mode

---

## Database & Tracking Tests

### 18. Usage Tracking

```sql
-- Check AddressLookup table
SELECT * FROM AddressLookup 
WHERE shop = 'test.myshopify.com' 
ORDER BY createdAt DESC 
LIMIT 10;
```

- [ ] Each search creates a record
- [ ] Records contain:
  - [ ] shop
  - [ ] query
  - [ ] resultCount
  - [ ] chargeAmount
  - [ ] createdAt
- [ ] sessionId populated (if available)

### 19. Settings Persistence

```sql
-- Check settings
SELECT * FROM SwiftcompleteSettings 
WHERE shop = 'test.myshopify.com';
```

- [ ] Settings save to database
- [ ] enabledCheckout field correct
- [ ] enabledProfile field correct
- [ ] updatedAt changes on save

---

## Integration Tests

### 20. With Payment Processors

#### Test: Stripe
- [ ] Select autocomplete address
- [ ] Proceed to payment
- [ ] Stripe address validation passes
- [ ] No address mismatch errors

#### Test: PayPal
- [ ] Select autocomplete address
- [ ] Proceed with PayPal
- [ ] Address transfers to PayPal correctly

#### Test: Shop Pay
- [ ] Select autocomplete address
- [ ] Use Shop Pay
- [ ] Address saves to Shop Pay account

### 21. With Checkout Customizations

#### Test: Custom Checkout Fields
- [ ] Add custom fields to checkout
- [ ] Autocomplete still works
- [ ] Custom fields don't interfere

#### Test: Other Checkout Extensions
- [ ] Install another checkout extension
- [ ] Both extensions work
- [ ] No JavaScript conflicts

---

## Deployment Tests

### 22. Production Deployment

#### Pre-Deploy Checklist
- [ ] All tests pass
- [ ] No console errors
- [ ] API key configured
- [ ] Settings saved
- [ ] Extension deployed

#### Deploy
```bash
shopify app deploy
```
- [ ] Deployment succeeds
- [ ] No build errors
- [ ] Extension version increments

#### Post-Deploy Verification
- [ ] Extension appears in production store
- [ ] Settings page loads
- [ ] Checkout autocomplete works
- [ ] Profile autocomplete works
- [ ] API endpoint accessible

---

## Monitoring & Metrics

### 23. Post-Launch Monitoring

#### Week 1
- [ ] Check error logs daily
- [ ] Monitor API response times
- [ ] Review usage statistics
- [ ] Check for customer complaints

#### Metrics to Track
```sql
-- Lookups per day
SELECT DATE(createdAt) as date, COUNT(*) as lookups
FROM AddressLookup
WHERE shop = 'yourstore.myshopify.com'
GROUP BY DATE(createdAt)
ORDER BY date DESC;

-- Average results per query
SELECT AVG(resultCount) as avg_results
FROM AddressLookup
WHERE shop = 'yourstore.myshopify.com';

-- Checkout vs Profile usage
SELECT 
  CASE 
    WHEN query LIKE '%checkout%' THEN 'checkout'
    ELSE 'profile'
  END as context,
  COUNT(*) as count
FROM AddressLookup
WHERE shop = 'yourstore.myshopify.com'
GROUP BY context;
```

---

## Sign-Off

### Development
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Code reviewed
- [ ] Documentation complete

**Signed:** ________________ **Date:** ________

### QA
- [ ] Manual testing complete
- [ ] All browsers tested
- [ ] Mobile tested
- [ ] Accessibility verified

**Signed:** ________________ **Date:** ________

### Product
- [ ] Meets requirements
- [ ] UX approved
- [ ] Performance acceptable
- [ ] Ready for production

**Signed:** ________________ **Date:** ________

---

**Testing Complete! ✅**

All tests passed? Deploy to production! 🚀

