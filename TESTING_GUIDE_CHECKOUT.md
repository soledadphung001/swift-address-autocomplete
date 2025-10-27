# Testing Guide - Checkout UI Extension

This guide provides step-by-step instructions for testing the Swift Address Autocomplete Checkout UI Extension.

## 📋 Prerequisites

Before testing, ensure:
- ✅ `npm run dev` is running
- ✅ App is installed on your development store
- ✅ Swiftcomplete API key is configured in admin settings
- ✅ "Enable Checkout pages" toggle is ON

## 🧪 Test Scenarios

### 1. Basic Functionality Test

#### Steps:

1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **Open Dev Console**
   - CLI opens: `https://xxx.trycloudflare.com/extensions/dev-console`

3. **Click "address-autocomplete-checkout" preview link**
   - Opens checkout editor with extension preview

4. **Type in the address field**
   - Enter: `"123 Main"`
   - Wait 300ms (debounce delay)

5. **Verify results appear**
   - Dropdown should show suggestions
   - Example:
     ```
     123 Main Street, New York, NY 10001
     123 Main Avenue, Los Angeles, CA 90001
     ```

6. **Select a suggestion**
   - Click or press Enter
   - Verify dropdown closes
   - Verify input field updates with selected address

#### Expected Results:
- ✅ Input field renders above native address form
- ✅ Debounce works (no API call until 300ms pause)
- ✅ Dropdown appears with suggestions
- ✅ Selection updates the field
- ✅ Dropdown closes after selection

---

### 2. Console Logging Verification

#### Steps:

1. **Open browser DevTools**
   - Press F12 or right-click → Inspect

2. **Go to Console tab**

3. **Type in address field**

4. **Check for demo logs**
   Look for logs prefixed with `[Demo]`:
   ```
   [Demo] 🚀 Extension initialized
   [Demo] 🔍 Searching for: "123 Main"
   [Demo] 📡 Fetching from: https://xxx.trycloudflare.com/api/address-autocomplete/search?shop=...
   [Demo] ✅ Success: 5 results
   [Demo] 📝 Results: [...]
   ```

#### Expected Results:
- ✅ Initialization log appears on load
- ✅ Search logs show query text
- ✅ API endpoint URL is correct (HTTPS tunnel URL)
- ✅ Success logs show result count
- ✅ No errors in console

---

### 3. API Integration Test

#### Steps:

1. **Open Network tab in DevTools**

2. **Type in address field**

3. **Watch for API requests**
   - URL: `https://xxx.trycloudflare.com/api/address-autocomplete/search?shop=...&q=123+Main&context=checkout`
   - Method: GET
   - Status: 200 OK

4. **Check response**
   ```json
   {
     "success": true,
     "results": [
       {
         "address": "123 Main Street",
         "city": "New York",
         "state": "NY",
         "zip": "10001",
         "country": "US"
       }
     ]
   }
   ```

#### Expected Results:
- ✅ Request sent after debounce delay
- ✅ Status 200 OK
- ✅ Response contains `success: true` and `results` array
- ✅ No CORS errors
- ✅ HTTPS tunnel URL used (not localhost)

---

### 4. Keyboard Navigation Test

#### Steps:

1. **Type in address field** → dropdown appears

2. **Press ↓ (Down Arrow)**
   - First item should highlight

3. **Press ↓ again**
   - Second item should highlight

4. **Press ↑ (Up Arrow)**
   - First item should highlight again

5. **Press Enter**
   - Selected item should populate the field
   - Dropdown should close

6. **Type again, then press Escape**
   - Dropdown should close without selection

#### Expected Results:
- ✅ Arrow keys navigate through suggestions
- ✅ Enter selects highlighted item
- ✅ Escape closes dropdown
- ✅ Visual highlight on selected item

---

### 5. Settings Validation Test

#### Test Case A: Feature Disabled

1. **Go to Admin → Address Autocomplete settings**

2. **Toggle "Enable Checkout pages" OFF**

3. **Save settings**

4. **Go back to checkout preview**

5. **Type in address field**

#### Expected Results:
- ✅ API returns `{ "success": false, "enabled": false }`
- ✅ No suggestions appear
- ✅ Extension shows "Feature disabled" or remains empty

---

#### Test Case B: Missing API Key

1. **Go to Admin → Address Autocomplete settings**

2. **Clear the API key field**

3. **Save settings**

4. **Go back to checkout preview**

5. **Type in address field**

#### Expected Results:
- ✅ API returns error: `{ "success": false, "error": "API key not configured" }`
- ✅ Extension handles gracefully (no crash)
- ✅ Console shows error log

---

### 6. Mock Data Fallback Test

This tests the demo fallback when API fails.

#### Steps:

1. **Stop the backend** (Ctrl+C in the terminal running `npm run dev`)

2. **Keep the Dev Console open** (extension preview should still be visible)

3. **Type in address field**

4. **Check console logs**
   ```
   [Demo] ❌ Error fetching real data
   [Demo] 🎭 Using mock data
   ```

5. **Verify mock results appear**
   ```
   123 Mock Street, Demo City, NY 10001
   456 Sample Avenue, Test Town, CA 90001
   ```

#### Expected Results:
- ✅ Extension doesn't crash
- ✅ Mock data appears in dropdown
- ✅ Console shows fallback message
- ✅ Mock selection still works

---

### 7. Multiple Shop Test

If you have multiple dev stores:

#### Steps:

1. **Install app on Store A**

2. **Configure API key for Store A**

3. **Test checkout preview** → should work

4. **Install app on Store B**

5. **Configure different API key for Store B**

6. **Test checkout preview** → should work independently

#### Expected Results:
- ✅ Settings are isolated per shop
- ✅ API calls use correct shop parameter
- ✅ Usage tracked separately per shop

---

### 8. Debounce Optimization Test

#### Steps:

1. **Type quickly without pausing**
   - Type: `"1"` → `"12"` → `"123"` → `"123 "` → `"123 M"` rapidly

2. **Check Network tab**

#### Expected Results:
- ✅ Only ONE API request sent (after 300ms pause)
- ✅ Not 5 separate requests
- ✅ Console shows only final search: `"123 M"`

---

### 9. Production Build Test

#### Steps:

1. **Build the extension**
   ```bash
   npm run deploy
   ```

2. **Enable in Checkout Editor**
   - Go to Settings → Checkout → Customize
   - Add "Address Autocomplete" extension
   - Save

3. **Create a test order**
   - Add product to cart
   - Go to checkout

4. **Test on live checkout**
   - Type in address field
   - Verify autocomplete works

#### Expected Results:
- ✅ Extension appears in live checkout
- ✅ Autocomplete functionality works
- ✅ API calls use production app URL (not tunnel)
- ✅ No console errors

---

## 🐛 Common Issues & Solutions

### Issue: Extension doesn't appear in preview

**Solution:**
1. Refresh the checkout preview page
2. Verify `npm run dev` is running
3. Check terminal for extension build errors

### Issue: API returns 404

**Solution:**
1. Check `SHOPIFY_APP_URL` is set correctly
2. Verify `app-origin.js` was generated by `gen-env.cjs`
3. Check backend is running (same terminal as `npm run dev`)

### Issue: CORS error in console

**Solution:**
1. Verify API route has CORS headers:
   ```typescript
   return json(data, {
     headers: {
       "Access-Control-Allow-Origin": "*",
       "Access-Control-Allow-Methods": "GET, OPTIONS",
     }
   });
   ```

### Issue: "Feature disabled" even when enabled

**Solution:**
1. Go to admin settings page
2. Verify "Enable Checkout pages" is ON
3. Click Save again
4. Clear browser cache and retry

### Issue: Mock data always shows (never real data)

**Solution:**
1. Verify backend is running
2. Check Network tab for actual API call
3. Verify API key is correct in settings
4. Check Swiftcomplete API is accessible

---

## ✅ Test Checklist for Interview Demo

Use this checklist when demonstrating for your take-home assignment:

- [ ] Extension renders in checkout preview
- [ ] Typing triggers autocomplete after debounce
- [ ] Dropdown shows real Swiftcomplete results (or mock if backend unavailable)
- [ ] Keyboard navigation works (arrows, Enter, Escape)
- [ ] Selection updates input field
- [ ] Console logs demonstrate understanding of flow
- [ ] No hardcoded URLs (automatic injection works)
- [ ] Settings page shows API key input and enable toggle
- [ ] API proxy respects enabledCheckout setting
- [ ] Network tab shows HTTPS API calls (not HTTP localhost)

---

## 📊 Performance Benchmarks

Expected performance:
- **Initial render**: < 100ms
- **Debounce delay**: 300ms
- **API response time**: 100-500ms (depending on Swiftcomplete)
- **Dropdown render**: < 50ms
- **Total time to results**: ~400-800ms after typing pause

---

## 🎯 Interview Tips

When presenting this project:

1. **Show the live demo first**
   - Open checkout preview
   - Type and show autocomplete working
   - Demonstrate keyboard navigation

2. **Explain the architecture**
   - Show the diagram (from README)
   - Explain why backend proxy (security)
   - Explain automatic URL injection (no hardcode)

3. **Walk through key files**
   - `index.jsx` - Extension component
   - `api.address-autocomplete.search.tsx` - Backend proxy
   - `gen-env.cjs` - Build-time injection
   - `app-origin.js` - Generated file

4. **Highlight production-ready patterns**
   - Settings validation
   - Usage tracking
   - Error handling
   - Debouncing for performance

5. **Discuss future improvements**
   - Address validation (not just autocomplete)
   - Billing API integration
   - Multi-language support
   - Analytics dashboard

---

## 📞 Need Help?

- Check console logs for error details
- Verify all prerequisites are met
- Review the README setup section
- Contact: phungthaouit@gmail.com

---

**Happy Testing! 🎉**

