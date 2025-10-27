# Checkout Deployment Guide - IMPORTANT

## ⚠️ Important Note About Deployment

The **vanilla JavaScript file** (`checkout-autocomplete-vanilla.js`) **cannot be deployed using `shopify app deploy`**. 

Checkout UI extensions that use `shopify app deploy` require the **UI Extensions SDK** (React-based), not vanilla JavaScript.

## 📋 Choose Your Deployment Method

### Option 1: Web Pixels (Recommended - Works on ALL Plans) ⭐

**Best for:** All Shopify plans (Basic, Shopify, Advanced, Plus)

1. **Copy the vanilla JS code:**
   ```
   extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js
   ```

2. **Go to Shopify Admin:**
   - Settings → Customer events → Web pixels
   - Click "Add custom pixel"

3. **Paste this code at the TOP:**
   ```javascript
   // Configuration
   window.CheckoutAutocompleteConfig = {
     apiEndpoint: 'YOUR_APP_URL/api/address-autocomplete/search',
     shop: 'YOUR_STORE.myshopify.com',
     enabled: true,
     context: 'checkout'
   };
   ```

4. **Then paste the entire contents of `checkout-autocomplete-vanilla.js` below it**

5. **Click "Save"**

✅ Done! Test your checkout.

---

### Option 2: checkout.liquid (Shopify Plus Only)

**Best for:** Shopify Plus merchants

1. **Go to:** Settings → Checkout → Customize checkout

2. **Edit `checkout.liquid`**

3. **Add before `</body>`:**
   ```liquid
   {% comment %} Address Autocomplete for Checkout {% endcomment %}
   <script>
     window.CheckoutAutocompleteConfig = {
       apiEndpoint: 'YOUR_APP_URL/api/address-autocomplete/search',
       shop: '{{ shop.permanent_domain }}',
       enabled: true,
       context: 'checkout'
     };
   </script>
   <script src="{{ 'checkout-autocomplete-vanilla.js' | asset_url }}" defer></script>
   ```

4. **Upload `checkout-autocomplete-vanilla.js` to your theme assets**

5. **Save**

✅ Done!

---

### Option 3: Use UI Extensions SDK (Advanced)

**If you want to use `shopify app deploy`**, you need to use the **UI Extensions SDK version**.

#### Step 1: Install Dependencies
```bash
cd extensions/checkout-address-autocomplete
npm install @shopify/ui-extensions-react @shopify/ui-extensions
```

#### Step 2: Update `index.js`

The current `index.js` has the framework, but needs proper UI Extensions SDK imports.

**Replace the contents of `src/index.js` with:**

```javascript
import {
  Banner,
  reactExtension,
  useApi,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const { extension, shop } = useApi();
  
  // Your autocomplete logic here
  // Note: This is more complex and requires React knowledge
  
  return null; // Extension works via DOM manipulation
}
```

#### Step 3: Update `shopify.extension.toml`

```toml
name = "checkout-address-autocomplete"

[[extensions]]
type = "ui_extension"
name = "Address Autocomplete"
handle = "checkout-address-autocomplete"

  [[extensions.targeting]]
  target = "purchase.checkout.block.render"

[build]
command = ""
path = "src/index.js"
```

#### Step 4: Deploy
```bash
shopify app deploy
```

**⚠️ Note:** This option is complex and requires React knowledge. We recommend **Option 1 (Web Pixels)** for simplicity.

---

## 🎯 Recommended Approach

### For Most Users: Use Option 1 (Web Pixels)

Here's exactly what to do:

1. **Open this file:**
   ```
   extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js
   ```

2. **Copy ALL the code (544 lines)**

3. **Go to Shopify Admin:**
   ```
   Settings → Customer events → Web pixels → Add custom pixel
   ```

4. **Paste this configuration FIRST:**
   ```javascript
   // Replace YOUR_APP_URL with your actual app URL
   window.CheckoutAutocompleteConfig = {
     apiEndpoint: 'https://your-app-url.com/api/address-autocomplete/search',
     shop: analytics.subscribe('checkout_started', (event) => {
       return event.data.checkout.order.customer.email.split('@')[1];
     }),
     enabled: true,
     context: 'checkout'
   };
   ```
   
   **Or simpler:**
   ```javascript
   window.CheckoutAutocompleteConfig = {
     apiEndpoint: 'YOUR_APP_URL/api/address-autocomplete/search',
     shop: 'yourstore.myshopify.com',
     enabled: true,
     context: 'checkout'
   };
   ```

5. **Then paste ALL the code from `checkout-autocomplete-vanilla.js`**

6. **Click Save**

7. **Test:**
   - Add item to cart
   - Go to checkout
   - Type in address field
   - See autocomplete! ✨

---

## 🔍 Why This Happened

The error occurred because:

1. **`shopify app deploy`** is for React-based UI Extensions
2. **Vanilla JavaScript** needs different deployment (Web Pixels or checkout.liquid)
3. The TOML configuration was mixing both approaches

## ✅ Summary

| Method | Plans | Complexity | Command |
|--------|-------|------------|---------|
| **Web Pixels** ⭐ | All | Easy | Copy/paste to admin |
| **checkout.liquid** | Plus only | Medium | Edit theme file |
| **UI Extensions SDK** | All | Hard | `shopify app deploy` |

**Recommendation:** Use **Web Pixels** (Option 1) - it's the easiest and works everywhere!

---

## 📞 Need Help?

If you're using **Web Pixels**:
1. Copy `checkout-autocomplete-vanilla.js`
2. Add config at the top
3. Paste into custom pixel
4. Save and test

That's it! No `shopify app deploy` needed.

