# Web Pixel Setup Guide - Auto Configuration

## 🎯 **Automatic App URL Detection**

This guide shows you how to set up address autocomplete in checkout using Web Pixels with **automatic configuration loading** - no need to manually set app URLs!

---

## ✅ **What's New**

Instead of manually configuring:
```javascript
// ❌ OLD WAY - Manual configuration
window.CheckoutAutocompleteConfig = {
  apiEndpoint: 'https://your-app-url.com/api/...',  // Had to set manually
  shop: 'yourstore.myshopify.com',                   // Had to set manually
  ...
};
```

The new version automatically fetches configuration:
```javascript
// ✅ NEW WAY - Auto configuration
// Just copy and paste the file - it handles everything!
```

---

## 🚀 **Setup Steps**

### Step 1: Copy the Web Pixel Code

Open this file and copy **ALL the code**:
```
extensions/checkout-address-autocomplete/src/checkout-web-pixel.js
```

### Step 2: Create Web Pixel in Shopify Admin

1. **Go to:** Settings → Customer events → Web pixels
2. **Click:** "Add custom pixel"
3. **Name:** "Checkout Address Autocomplete"
4. **Paste:** All the code from `checkout-web-pixel.js`
5. **Click:** "Save"
6. **Click:** "Connect" to enable

### Step 3: Test!

1. Go to your store
2. Add item to cart
3. Go to checkout
4. Type in address field
5. See autocomplete! ✨

**That's it!** No manual configuration needed!

---

## 🔧 **How It Works**

### 1. Configuration Endpoint

The app now has a new endpoint: `/api/checkout-config`

**What it does:**
- Returns shop configuration including app URL
- Automatically detects the app URL from the request
- Checks if feature is enabled for checkout

**Example response:**
```json
{
  "success": true,
  "config": {
    "enabled": true,
    "enabledCheckout": true,
    "apiEndpoint": "https://your-app.fly.dev/api/address-autocomplete/search",
    "shop": "yourstore.myshopify.com",
    "minCharacters": 3,
    "debounceDelay": 300,
    "context": "checkout"
  }
}
```

### 2. Web Pixel Auto-Detection

The Web Pixel automatically:
1. ✅ Detects shop domain from checkout page
2. ✅ Constructs config endpoint URL
3. ✅ Fetches configuration
4. ✅ Enables autocomplete if settings allow

### 3. Smart URL Detection

The pixel tries multiple methods to find the app URL:
1. Checks script tags on the page
2. Uses request origin
3. Falls back to Shopify app proxy pattern

---

## 🧪 **Testing the Configuration**

### Test 1: Check if Config Loads

Open browser console (F12) and look for:
```
[Checkout Address Autocomplete] Initializing Web Pixel...
[Checkout Address Autocomplete] Fetching config from: https://...
[Checkout Address Autocomplete] Config loaded successfully
[Checkout Address Autocomplete] Enabled: true
[Checkout Address Autocomplete] Checkout enabled: true
```

### Test 2: Check Configuration Manually

Open browser console and run:
```javascript
CheckoutAddressAutocomplete.config
// Should show loaded configuration

CheckoutAddressAutocomplete.configLoaded()
// Should return true
```

### Test 3: Test the Config Endpoint Directly

Visit in browser:
```
https://your-app-url.com/api/checkout-config?shop=yourstore.myshopify.com
```

Should return JSON with configuration.

---

## 🐛 **Troubleshooting**

### Issue 1: Config Not Loading

**Symptoms:**
- Console shows: "Failed to load configuration"
- Autocomplete doesn't appear

**Solutions:**

1. **Check if app is deployed:**
   ```bash
   # Your app must be accessible from internet
   curl https://your-app-url.com/api/checkout-config?shop=yourstore.myshopify.com
   ```

2. **Check CORS headers:**
   - Config endpoint has CORS enabled
   - Should work from any domain

3. **Check shop domain detection:**
   ```javascript
   // In browser console
   window.Shopify.shop  // Should show your shop domain
   ```

### Issue 2: App URL Not Detected

**Symptoms:**
- Console shows: "Cannot load config: shop domain not found"

**Solution:**

The pixel tries to detect the app URL automatically, but if it fails, you can help it:

**Option A: Add as script tag (before Web Pixel)**

In theme or checkout settings, add:
```html
<script>
  window.SWIFTCOMPLETE_APP_URL = 'https://your-app.fly.dev';
</script>
```

Then update `getAppUrl()` in the Web Pixel to check this first:
```javascript
function getAppUrl() {
  // Check if manually set
  if (window.SWIFTCOMPLETE_APP_URL) {
    return window.SWIFTCOMPLETE_APP_URL;
  }
  // ... rest of detection code
}
```

**Option B: Use App Proxy**

If your app is set up with Shopify App Proxy:
```
App Proxy Path: /apps/address-autocomplete
```

The config will be available at:
```
https://yourstore.com/apps/address-autocomplete/api/checkout-config
```

### Issue 3: "Feature is disabled in settings"

**Symptoms:**
- Config loads but autocomplete doesn't appear
- Console shows: "Feature is disabled in settings"

**Solution:**

1. **Go to:** Apps → Swift Address Autocomplete → Settings
2. **Enable:** ✅ "Enable address autocomplete" (master switch)
3. **Enable:** ✅ "Checkout pages"
4. **Save** settings

---

## 📊 **Configuration Flow Diagram**

```
┌─────────────────────┐
│   Web Pixel Loads   │
│   (checkout page)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Detect Shop Domain │
│  (from URL/Shopify) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fetch Config from: │
│  /api/checkout-     │
│   config?shop=...   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend Returns:   │
│  - App URL          │
│  - API endpoint     │
│  - Enabled status   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Enable Autocomplete│
│  (if settings allow)│
└─────────────────────┘
```

---

## 🔐 **Security Notes**

1. **Public Endpoint:** `/api/checkout-config` is public (needs to be for Web Pixels)
2. **No Sensitive Data:** Only returns public configuration, not API keys
3. **CORS Enabled:** Accessible from any domain (required for Web Pixels)
4. **Rate Limiting:** Consider adding if needed

---

## 🎯 **Advantages Over Manual Config**

| Feature | Manual Config | Auto Config |
|---------|--------------|-------------|
| **Setup Complexity** | High (must set URLs) | Low (just paste) |
| **App URL Changes** | Must update manually | Auto-updates |
| **Multiple Environments** | Need separate configs | Works automatically |
| **Maintenance** | High | Low |
| **Error Prone** | Yes (typos in URLs) | No |

---

## 📝 **For Developers**

### Adding Custom Configuration

To add more config options, update both files:

**1. Backend (`api.checkout-config.tsx`):**
```typescript
return json({
  config: {
    // ... existing config
    customOption: settings?.customOption || defaultValue,
  }
});
```

**2. Web Pixel (`checkout-web-pixel.js`):**
```javascript
let CONFIG = {
  // ... existing config
  customOption: null
};
```

### Environment-Specific URLs

If you have different URLs for dev/staging/prod:

```typescript
// In api.checkout-config.tsx
const appUrl = process.env.NODE_ENV === 'production'
  ? 'https://prod-app.fly.dev'
  : new URL(request.url).origin;
```

---

## ✅ **Checklist**

Before deploying to production:

- [ ] Config endpoint deployed and accessible
- [ ] Test config endpoint: `/api/checkout-config?shop=yourstore.myshopify.com`
- [ ] Web Pixel created in Shopify Admin
- [ ] Web Pixel enabled/connected
- [ ] "Checkout pages" enabled in app settings
- [ ] Test in actual checkout
- [ ] Check browser console for errors
- [ ] Verify addresses autocomplete
- [ ] Test address selection and form fill

---

## 🎉 **Summary**

✅ **No manual configuration needed!**  
✅ **Automatic app URL detection**  
✅ **Fetches settings from backend**  
✅ **Works on all Shopify plans**  
✅ **Easy to deploy and maintain**  

Just copy `checkout-web-pixel.js` to Web Pixels and you're done! 🚀

---

## 📞 **Support**

If you run into issues:

1. Check browser console for error messages
2. Test config endpoint directly in browser
3. Verify settings are enabled in admin
4. Check CORS headers are present
5. Ensure app is deployed and accessible

**Config endpoint test URL:**
```
https://YOUR_APP_URL/api/checkout-config?shop=YOUR_STORE.myshopify.com
```

Should return JSON with `success: true` and configuration object.

