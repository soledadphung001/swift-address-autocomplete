# Checkout Address Autocomplete Extension

## ⚠️ Important: Deployment Method

This extension **cannot be deployed using `shopify app deploy`** with vanilla JavaScript.

## ✅ Recommended: Use Web Pixels Instead

**The easiest way to deploy this is via Web Pixels:**

1. **Copy the file:** `src/checkout-autocomplete-vanilla.js`

2. **Go to Shopify Admin:**
   - Settings → Customer events → Web pixels
   - Click "Add custom pixel"

3. **Add configuration at the top:**
   ```javascript
   window.CheckoutAutocompleteConfig = {
     apiEndpoint: 'YOUR_APP_URL/api/address-autocomplete/search',
     shop: 'yourstore.myshopify.com',
     enabled: true,
     context: 'checkout'
   };
   ```

4. **Paste the entire `checkout-autocomplete-vanilla.js` code below it**

5. **Save and test!**

## 📚 Full Instructions

See: **`../../CHECKOUT_DEPLOYMENT_GUIDE.md`** for complete deployment options.

## 📁 Files in This Directory

- **`src/checkout-autocomplete-vanilla.js`** ⭐ - Use this! (Copy to Web Pixels)
- **`src/index.js`** - UI Extensions SDK version (advanced, needs React setup)
- **`shopify.extension.toml`** - Extension config (for SDK version only)

## 🎯 Quick Start

```bash
# Don't run this:
# shopify app deploy  ❌

# Instead:
# 1. Copy src/checkout-autocomplete-vanilla.js
# 2. Paste into Web Pixels (Settings → Customer events)
# 3. Add config (see above)
# 4. Save
```

✅ Done! That's it!

