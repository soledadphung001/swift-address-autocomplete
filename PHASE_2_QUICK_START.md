# Phase 2: Checkout Autocomplete - Quick Start Guide

## 🚀 Quick Implementation (5 Minutes)

### 1. Deploy Extension
```bash
cd extensions/checkout-address-autocomplete
shopify app deploy
```

### 2. Enable in Admin
1. Go to: **Apps** → **Swift Address Autocomplete** → **Settings**
2. Check: ☑️ **Checkout pages**
3. Click: **Save Settings**

### 3. Test in Checkout
1. Add item to cart
2. Go to checkout
3. Type in "Address" field
4. See dropdown with suggestions! ✨

---

## 📋 Key Points

### ✅ Uses Existing address1 Field
- **No new fields created**
- **No hiding needed**
- Enhances the native checkout field

### ✅ Handles 2-Character Country Codes
- API returns: `"US"`
- Checkout shows: `<option value="US">United States</option>`
- Automatically matched ✓

### ✅ Independent Controls
```
Master Switch (enabled)
├── Checkout pages (enabledCheckout)
└── Profile pages (enabledProfile)
```

---

## 🔧 Configuration Options

### Option A: Checkout Extensibility (Recommended)
- **Who:** All merchants
- **How:** Auto-deployed via `shopify app deploy`
- **Where:** Settings → Checkout → Extensions

### Option B: checkout.liquid
- **Who:** Shopify Plus only
- **How:** Add script to checkout.liquid
- **File:** `checkout-autocomplete-vanilla.js`

### Option C: Web Pixels
- **Who:** All merchants
- **How:** Settings → Customer events → Add custom pixel
- **Code:** Copy from `checkout-autocomplete-vanilla.js`

---

## 🧪 Testing Checklist

```
Checkout Page:
[ ] Dropdown appears when typing
[ ] Shows 5 or fewer suggestions
[ ] Click selects address
[ ] All fields populate:
    [ ] Address 1
    [ ] City
    [ ] State/Province
    [ ] ZIP/Postal Code
    [ ] Country (2-char code)
[ ] Keyboard navigation works (↑↓ Enter Esc)
[ ] Can disable via admin settings

Profile Page (should still work independently):
[ ] Autocomplete works in /account/addresses
[ ] Can disable via admin settings
[ ] Doesn't affect checkout when disabled
```

---

## 🐛 Common Issues

### Dropdown doesn't appear
```bash
# Check:
1. Admin Settings → Checkout pages is checked ☑️
2. Browser console for errors
3. Extension is deployed: shopify app list extensions
```

### Country field stays empty
```javascript
// The field uses 2-char codes
// Check select options:
document.querySelector('select[name="country"]').options

// Should show: value="US" (not "United States")
```

### Works in profile but not checkout
```bash
# Deploy checkout extension:
cd extensions/checkout-address-autocomplete
shopify app deploy

# Verify in admin:
Settings → Checkout → Extensions → Address Autocomplete
```

---

## 📄 Files Reference

| File | Purpose |
|------|---------|
| `app/routes/app.address-autocomplete.tsx` | Admin settings page |
| `app/routes/api.address-autocomplete.search.tsx` | API route (context-aware) |
| `extensions/address-autocomplete/assets/address-autocomplete.js` | Profile page script |
| `extensions/checkout-address-autocomplete/src/checkout-autocomplete-vanilla.js` | Checkout script |

---

## 🎯 Architecture in 3 Lines

1. **Admin** sets `enabledCheckout` / `enabledProfile` flags
2. **API** checks context and returns results if enabled
3. **Extension** enhances address1 field with autocomplete

---

## 💡 Key Design Decisions

### Why use existing address1?
✅ No field duplication  
✅ Native validation preserved  
✅ Payment processor compatible  
✅ No hiding logic needed

### Why context parameter?
✅ Independent enable/disable  
✅ Different field handling (2-char codes)  
✅ Separate usage tracking  
✅ Future extensibility (order status)

### Why vanilla JS?
✅ Maximum compatibility  
✅ Works on all Shopify plans  
✅ No build step required  
✅ Easy to debug

---

## 📚 Full Documentation

See: [`PHASE_2_CHECKOUT_IMPLEMENTATION.md`](./PHASE_2_CHECKOUT_IMPLEMENTATION.md)

---

## 🆘 Need Help?

1. Check: Browser console for errors
2. Test: API endpoint directly
   ```bash
   curl "http://localhost:3000/api/address-autocomplete/search?shop=test.myshopify.com&q=123%20Main&context=checkout"
   ```
3. Verify: Settings in admin
4. Review: Full documentation above

---

**Ready to deploy? Let's go! 🚀**

