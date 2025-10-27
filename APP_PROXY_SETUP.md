# ✅ App Proxy Setup - Complete Guide

## 🎯 **What is App Proxy?**

App Proxy allows your extension to make API calls to the **store's domain** instead of your app's domain. This solves:
- ✅ HTTPS requirement issues
- ✅ CORS problems
- ✅ Dynamic URL changes (no more updating when tunnel restarts!)

---

## 🔄 **How It Works**

```
┌─────────────────────────────────────────────────────┐
│  Checkout Extension                                 │
│  (runs on Shopify's domain)                         │
│                                                     │
│  fetch('/apps/address-autocomplete/search?q=...')  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Same-origin request ✅
                   ▼
┌─────────────────────────────────────────────────────┐
│  Store Domain                                       │
│  https://yourstore.myshopify.com                    │
│                                                     │
│  /apps/address-autocomplete/search                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Shopify proxies to your app
                   ▼
┌─────────────────────────────────────────────────────┐
│  Your App                                           │
│  https://your-tunnel.trycloudflare.com             │
│                                                     │
│  app/routes/apps.address-autocomplete.search.tsx    │
└─────────────────────────────────────────────────────┘
```

---

## 📁 **Files Created/Modified**

### ✅ **1. `shopify.app.toml`** (Modified)

Added app proxy configuration:

```toml
[app_proxy]
url = "https://patricia-reproduced-bird-citizenship.trycloudflare.com"
prefix = "apps"
subpath = "address-autocomplete"
```

**What this does:**
- Requests to `/apps/address-autocomplete/*` on the store
- Are proxied to your app URL
- Automatically updated when you run `shopify app dev`

### ✅ **2. `app/routes/apps.address-autocomplete.search.tsx`** (New!)

The proxy route that handles address searches:

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.public.appProxy(request);
  
  // Get parameters
  const query = url.searchParams.get("q");
  const shop = url.searchParams.get("shop");
  
  // Call Swiftcomplete API
  // Return results
}
```

**Features:**
- ✅ App proxy authentication
- ✅ Settings validation
- ✅ Context-aware (checkout vs profile)
- ✅ Usage tracking
- ✅ Error handling

### ✅ **3. `extensions/checkout-address-autocomplete/src/index.jsx`** (Modified)

Updated to use proxy URL:

```javascript
const CONFIG = {
  apiEndpoint: '/apps/address-autocomplete/search',  // ✅ Relative URL!
  shopDomain: shop?.domain || shop?.myshopifyDomain,
  // ...
};
```

**Benefits:**
- ✅ No hardcoded URLs
- ✅ No HTTPS issues
- ✅ Works automatically

---

## 🚀 **How to Use**

### **Step 1: Update App Proxy URL**

When your Cloudflare tunnel restarts, update `shopify.app.toml`:

```toml
[app_proxy]
url = "https://YOUR-NEW-TUNNEL-URL.trycloudflare.com"
prefix = "apps"
subpath = "address-autocomplete"
```

### **Step 2: Restart Dev Server**

```bash
# Press Ctrl+C to stop
npm run dev
```

The CLI will automatically update the app proxy configuration in Shopify!

### **Step 3: Test**

1. Open checkout preview
2. Type in address field
3. Check console:
   ```
   [Demo] 📡 Fetching from: /apps/address-autocomplete/search?shop=...&q=...
   ```
4. See results! ✅

---

## 🧪 **Testing the Proxy**

### **Test 1: Direct Access**

Visit in browser:
```
https://yourstore.myshopify.com/apps/address-autocomplete/search?shop=yourstore.myshopify.com&q=123+Main
```

Should return JSON with address results!

### **Test 2: From Extension**

In checkout preview:
1. Type in address field
2. Open F12 console
3. Should see: `[Demo] 📡 Fetching from: /apps/address-autocomplete/search`
4. Response should have results

### **Test 3: Check Proxy Route**

In your app terminal, you should see:
```
[App Proxy] Address search request: { query: '123 Main', shop: '...', context: 'checkout' }
[App Proxy] Calling Swiftcomplete API
[App Proxy] Search successful, results: 5
```

---

## 🎯 **URL Structure**

### **From Store's Perspective:**
```
https://yourstore.myshopify.com/apps/address-autocomplete/search
│                               │    │                      │
│                               │    │                      └─ subpath
│                               │    └─────────────────────── prefix
└─────────────────────────────── store domain
```

### **Proxied To:**
```
https://your-tunnel.trycloudflare.com/apps/address-autocomplete/search
│                                 │    │                      │
│                                 │    │                      └─ route matches subpath
│                                 │    └─────────────────────── route matches prefix
└─────────────────────────────── your app URL
```

---

## ✅ **Advantages**

| Feature | Before (Direct) | After (App Proxy) |
|---------|----------------|-------------------|
| **URL Changes** | Must update extension | Automatic via CLI |
| **HTTPS Issues** | Required HTTPS URL | Works automatically |
| **CORS** | Need CORS headers | Same-origin ✅ |
| **URL Management** | Hardcoded | Dynamic |
| **Authentication** | Manual | Built-in |

---

## 🔧 **How the Route Works**

```typescript
// 1. Authenticate app proxy request
await authenticate.public.appProxy(request);

// 2. Get parameters from URL
const query = url.searchParams.get("q");      // Search query
const shop = url.searchParams.get("shop");    // Shop domain
const context = url.searchParams.get("context"); // 'checkout' or 'profile'

// 3. Validate settings
const settings = await prisma.swiftcompleteSettings.findUnique({ where: { shop } });
if (!settings.enabledCheckout) { /* return error */ }

// 4. Call Swiftcomplete API
const response = await fetch(`https://api.swiftcomplete.com/...`);

// 5. Track usage
await prisma.swiftcompleteSettings.update({
  where: { shop },
  data: { usageCount: { increment: 1 } }
});

// 6. Return results
return json({ results: data.results });
```

---

## 📝 **When Tunnel URL Changes**

### **Old Way (Manual):**
1. Tunnel restarts with new URL ❌
2. Update hardcoded URL in extension ❌
3. Rebuild extension ❌
4. Test ❌
**(Annoying!)**

### **New Way (App Proxy):**
1. Tunnel restarts with new URL
2. Update `shopify.app.toml`:
   ```toml
   [app_proxy]
   url = "https://new-url.trycloudflare.com"
   ```
3. Restart `npm run dev`
4. CLI updates Shopify automatically ✅
5. Extension continues to work! ✅
**(Easy!)**

---

## 🎓 **For Your Interview**

**What to explain:**
> "I implemented an app proxy to handle API requests from the checkout extension. This solves several problems:
> 
> 1. **Same-Origin Requests**: The extension makes requests to the store's domain, which are then proxied to my app. This eliminates CORS issues.
> 
> 2. **Dynamic URLs**: When my development tunnel URL changes, I only need to update the shopify.app.toml file and restart the dev server. The Shopify CLI automatically updates the proxy configuration.
> 
> 3. **Security**: The app proxy includes built-in authentication via Shopify's `authenticate.public.appProxy()` method.
> 
> 4. **Simplicity**: The extension code uses a simple relative URL (`/apps/address-autocomplete/search`) instead of managing absolute URLs.
> 
> This is a production-ready pattern recommended by Shopify for apps that need to make API calls from frontend extensions."

**This demonstrates:**
- ✅ Understanding of Shopify app architecture
- ✅ Knowledge of same-origin policy and CORS
- ✅ Problem-solving with platform features
- ✅ Production-ready thinking

---

## 🎉 **Summary**

✅ **No more URL management issues!**  
✅ **No more HTTPS errors!**  
✅ **No more CORS problems!**  
✅ **Clean, simple code!**  
✅ **Production-ready!**  

Just update `shopify.app.toml` when your tunnel restarts and everything works! 🚀

