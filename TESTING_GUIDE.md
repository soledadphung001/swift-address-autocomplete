# Testing Guide - Address Autocomplete

## 🧪 How to Test the Popup Detection

This guide will help you verify that the address autocomplete works correctly on customer profile pages, especially the "Add Address" popup.

---

## Prerequisites

Before testing, ensure:

1. ✅ Database migration has been run
2. ✅ App is running (`npm run dev`)
3. ✅ Extension is deployed
4. ✅ You have a test store configured

---

## Step 1: Configure the App

1. Start your app:
   ```bash
   npm run dev
   ```

2. Log into your Shopify admin
3. Navigate to: **Apps → Your App → Address Autocomplete**
4. Enter test Swiftcomplete API key (or use mock for now)
5. Enable "Profile & account pages"
6. Click **Save Settings**

---

## Step 2: Enable Theme Extension

1. Go to: **Online Store → Themes**
2. Click **Customize** on your active theme
3. In the theme editor, look for **App Embeds** section (usually bottom-left)
4. Find **"Address Autocomplete"**
5. Toggle it **ON**
6. Click **Save**

---

## Step 3: Test on Customer Account Page

### **A. Create Test Customer (if needed)**

1. Go to: **Customers** in Shopify admin
2. Click **Add customer**
3. Enter email: `test@example.com`
4. Check "Send account invite"
5. Set up account with password

### **B. Access Customer Account**

1. Open your store in **Incognito/Private window**
2. Log in as the test customer
3. Go to: **Account → Addresses**

### **C. Test the "Add Address" Popup**

1. Click **"Add new address"** button
2. A popup/modal should appear
3. **Open browser DevTools** (F12 or Right-click → Inspect)
4. Go to **Console** tab

**Expected Console Output:**
```
[Address Autocomplete] Initializing...
[Address Autocomplete] Found 0 address inputs (initial page)
[Address Autocomplete] DOM observer activated
[Address Autocomplete] Found 1 address inputs (after popup)
[Address Autocomplete] Attaching to: <input name="address[address1]">
[Address Autocomplete] Attached successfully
```

5. Start typing an address in the **Address** field (e.g., "123 Main")
6. After 300ms, you should see:
   - "Loading..." message
   - Autocomplete dropdown appears
   - Address suggestions (if API is connected)

### **D. Test Keyboard Navigation**

1. Type an address to show suggestions
2. Press **Arrow Down** - should highlight next item
3. Press **Arrow Up** - should highlight previous item
4. Press **Enter** - should select highlighted item
5. Press **Escape** - should close dropdown

### **E. Test Form Auto-Fill**

1. Select an address from dropdown
2. Verify these fields are auto-filled:
   - ✅ Address
   - ✅ City
   - ✅ State/Province
   - ✅ ZIP/Postal Code
   - ✅ Country (if available)

---

## Step 4: Test Edit Address Popup

1. Save the address from Step 3
2. Back on addresses page, click **"Edit"** on any address
3. Edit popup should appear
4. Verify autocomplete works the same way
5. Check console for same initialization logs

---

## Step 5: Test with Mock API (No Swiftcomplete Required)

If you don't have Swiftcomplete API yet, modify the backend API for testing:

**File:** `app/routes/api.address-autocomplete.search.tsx`

Replace the API call section with:

```typescript
// Mock data for testing
const mockResults = [
  {
    address: `${query} Street`,
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    country: "US"
  },
  {
    address: `${query} Avenue`,
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "US"
  }
];

// Track usage (still works)
await prisma.addressLookup.create({
  data: {
    shop,
    query: query.trim(),
    resultCount: mockResults.length,
    charged: false,
    chargeAmount: settings.chargePerLookup,
  },
});

return json({ results: mockResults, success: true });
```

Now test again - you should see mock suggestions!

---

## Step 6: Mobile Testing

1. Open Chrome DevTools (F12)
2. Click **Toggle Device Toolbar** (phone icon) or press `Ctrl+Shift+M`
3. Select a mobile device (e.g., iPhone 12)
4. Repeat Step 3 tests
5. Verify:
   - ✅ Dropdown is responsive
   - ✅ Touch interactions work
   - ✅ No layout issues

---

## Step 7: Test Different Themes

The extension should work on any theme. Test with:

1. **Dawn** (default Shopify theme)
2. **Debut** (older popular theme)
3. Your custom theme (if any)

For each theme:
1. Activate theme
2. Enable app embed
3. Repeat Step 3 tests
4. Check console for initialization logs

---

## 🐛 Troubleshooting

### **Problem: No console logs appearing**

**Solution:**
- Check if JavaScript file is loaded (Network tab)
- Verify app embed is enabled in theme
- Check for JavaScript errors in console

### **Problem: "Loading..." shows but no results**

**Solution:**
- Check Network tab for API call
- Verify API endpoint is correct: `/apps/address-autocomplete/search?q=...`
- Check backend logs for errors
- Ensure SwiftcompleteSettings exists in database

### **Problem: Popup opens but autocomplete doesn't attach**

**Solution:**
- Check console for errors
- Popup might use different HTML structure
- Add theme-specific selectors to `findAddressInputs()` function

**To debug:**
```javascript
// In browser console
window.AddressAutocomplete.enhanceExistingForms();
```

### **Problem: Dropdown appears but positioned incorrectly**

**Solution:**
- Check if parent element has `position: relative`
- Adjust CSS in `address-autocomplete.css`
- May need theme-specific CSS overrides

---

## 📊 Verify Usage Tracking

1. After making several address searches
2. Go to: **Apps → Your App → Address Autocomplete**
3. Check "Usage Statistics (Last 30 Days)"
4. Should show:
   - Number of lookups
   - Total cost ($0.03 × lookups)

You can also check database directly:
```bash
npx prisma studio
```

Open `AddressLookup` table and verify records are created.

---

## ✅ Success Criteria

Your implementation is working if:

- ✅ Console shows initialization logs when popup appears
- ✅ Typing in address field triggers autocomplete
- ✅ Dropdown shows suggestions (or mock data)
- ✅ Selecting suggestion fills all form fields
- ✅ Keyboard navigation works (arrows, Enter, Escape)
- ✅ Mobile responsive
- ✅ Usage tracked in database
- ✅ Works on multiple themes

---

## 🎥 Screen Recording Tips

When demonstrating to stakeholders:

1. Open DevTools console (show technical proof)
2. Navigate to customer account → addresses
3. Click "Add new address"
4. Show popup appearing + console logs
5. Type address slowly
6. Show autocomplete dropdown
7. Select an address
8. Show all fields auto-filled
9. Go to admin panel
10. Show usage statistics updated

---

## Next Steps After Testing

Once testing is successful:

1. ✅ Connect real Swiftcomplete API
2. ✅ Test with production data
3. ✅ Implement billing integration
4. ✅ Add error handling for API failures
5. ✅ Set up monitoring/analytics

---

**Happy Testing! 🚀**


