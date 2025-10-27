# Interview Demo Guide - Address Autocomplete

## 🎯 **Purpose**

This guide helps you demonstrate the Checkout Address Autocomplete feature for your interview take-home assignment.

You will show:
1. ✅ Understanding of Checkout UI Extension architecture
2. ✅ React component rendering in Shopify checkout
3. ✅ API integration with Swiftcomplete
4. ✅ Reactive UI with real-time search
5. ✅ Extension point targeting

---

## 🚀 **How to Run the Demo**

### **Prerequisites**

Make sure you have:
- Node.js installed
- Shopify CLI installed (`npm install -g @shopify/cli @shopify/app`)
- Cloudflare tunnel running (for API access)

### **Step 1: Start Your App Backend**

Open **Terminal 1**:

```bash
cd "z:\SOURCE CODE\swift-address-autocomplete"
npm run dev
```

This starts:
- ✅ Remix app on port 3000 (or Cloudflare tunnel)
- ✅ API endpoint: `/api/address-autocomplete/search`
- ✅ Config endpoint: `/api/checkout-config`

**Keep this running!**

### **Step 2: Start Shopify Development Preview**

Open **Terminal 2**:

```bash
cd "z:\SOURCE CODE\swift-address-autocomplete"
shopify app dev
```

This will:
1. Ask you to select a store (use any development store)
2. Build the extension
3. Generate a preview URL
4. Open preview in browser

**Important:** When prompted:
- Select your development store
- Allow the app to be installed
- Grant permissions

### **Step 3: Open Checkout Preview**

After `shopify app dev` starts, you'll see:

```
Preview URL: https://admin.shopify.com/store/YOUR-STORE/apps/YOUR-APP/...
```

Click the preview URL, then:

1. Click **"Test your app"**
2. Choose **"Checkout UI extension"**
3. You'll see a **simulated checkout page**
4. The extension will render at the delivery address section!

---

## 🎨 **What the Recruiter Will See**

### **Visual Demo:**

1. **Input Field**: "Search Address" text field appears
2. **Type 3+ characters**: e.g., "123 Main"
3. **Loading State**: "Loading addresses..." appears
4. **Results Dropdown**: Shows address suggestions
5. **Click Suggestion**: Address populates the field

### **Console Logs** (Open F12):

```
[Demo] 🔍 Search triggered with query: 123 Main
[Demo] ⏳ Loading addresses...
[Demo] 📡 Fetching from: http://localhost:3000/api/address-autocomplete/search?shop=...&q=123%20Main&context=checkout
[Demo] 📥 Response status: 200
[Demo] ✅ Received 5 results
[Demo] 📦 Results: [{address: "123 Main St", ...}, ...]
[Demo] ✔️ Search complete
```

If API fails (network error):
```
[Demo] ❌ Error: Failed to fetch
[Demo] 💡 Using mock data for demo...
[Demo] 🎭 Mock results: [{address: "123 Main Street", ...}]
```

---

## 📋 **Interview Talking Points**

### **1. Extension Architecture**

**Explain:**
```
"I'm using Shopify's Checkout UI Extensions API to render a custom component 
in the checkout flow. The extension targets the delivery address section using 
the 'purchase.checkout.delivery-address.render-before' extension point."
```

**Show:** `extensions/checkout-address-autocomplete/shopify.extension.toml`
```toml
[[extensions.targeting.targets]]
target = "purchase.checkout.delivery-address.render-before"
```

### **2. React Component**

**Explain:**
```
"I built a React component using @shopify/ui-extensions-react that renders
a TextField with autocomplete functionality. The component manages state for
query input, loading status, and search results."
```

**Show:** `extensions/checkout-address-autocomplete/src/index.jsx`
```jsx
function AddressAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... state management
}
```

### **3. API Integration**

**Explain:**
```
"When the user types, I debounce the input and make a fetch request to the 
Swiftcomplete API through my backend proxy. This prevents rate limiting and 
keeps the API key secure."
```

**Show:** API call in `searchAddress` function:
```jsx
const apiUrl = `${CONFIG.apiEndpoint}?shop=${CONFIG.shopDomain}&q=${searchQuery}&context=checkout`;
const response = await fetch(apiUrl);
const data = await response.json();
```

### **4. Reactive UI**

**Explain:**
```
"I use React hooks (useState, useCallback, useEffect) to create a reactive UI.
The interface updates in real-time as the user types, showing loading states,
results, and error handling."
```

**Show:** Debounced search:
```jsx
const handleInputChange = useCallback((value) => {
  setQuery(value);
  clearTimeout(debounceTimer);
  const timer = setTimeout(() => searchAddress(value), CONFIG.debounceDelay);
  setDebounceTimer(timer);
}, [debounceTimer, searchAddress]);
```

### **5. Error Handling**

**Explain:**
```
"I implemented comprehensive error handling with fallback mock data. If the 
API is unavailable (network issues, CORS), the extension still demonstrates 
functionality using mock results."
```

**Show:** Try-catch with fallback:
```jsx
try {
  const response = await fetch(apiUrl);
  // ... handle response
} catch (error) {
  // Fallback to mock data for demo
  const mockResults = [{ address: `${searchQuery} Street`, ... }];
  setResults(mockResults);
}
```

---

## 🧪 **Testing Checklist for Recruiter**

Walk through these points during the demo:

- [ ] **Extension loads** in checkout preview
- [ ] **Input field renders** correctly
- [ ] **Type 3 characters** triggers search (e.g., "123")
- [ ] **Loading state** shows "Loading addresses..."
- [ ] **Results appear** in dropdown list
- [ ] **Click result** populates the field
- [ ] **Console logs** show the flow clearly
- [ ] **Error handling** works (disconnect network, see mock data)
- [ ] **Responsive** - UI updates smoothly

---

## 🎓 **Key Technical Skills Demonstrated**

### ✅ **Shopify Platform Knowledge**
- Checkout UI Extensions API
- Extension points and targeting
- Sandboxed environment constraints
- React-based component development

### ✅ **React Proficiency**
- Functional components
- Hooks (useState, useCallback, useEffect)
- Event handling
- Conditional rendering
- List rendering

### ✅ **API Integration**
- Fetch API
- Async/await
- Error handling
- URL construction and encoding
- CORS understanding

### ✅ **UX Best Practices**
- Debouncing user input
- Loading states
- Empty states
- Error messages
- Keyboard navigation

### ✅ **Code Quality**
- Clean code structure
- Meaningful variable names
- Comments and documentation
- Error boundaries
- Graceful degradation

---

## 💬 **Answering Common Questions**

### Q: "Why use a backend proxy instead of calling Swiftcomplete directly?"

**A:** 
```
"Security and control. The Swiftcomplete API key needs to be kept secret. 
By proxying through my backend, I can:
1. Hide the API key from the client
2. Implement rate limiting
3. Track usage per shop
4. Add caching if needed
5. Transform the response format if necessary"
```

### Q: "How would this work in production?"

**A:**
```
"In production:
1. The app would be deployed to a stable URL (Fly.io, Heroku, etc.)
2. Merchants install the app from the Shopify App Store
3. They configure their Swiftcomplete API key in the app settings
4. The extension automatically appears in their checkout
5. For non-Plus stores, we'd use Web Pixels as an alternative deployment method"
```

### Q: "What about non-Plus stores?"

**A:**
```
"Great question! Checkout UI Extensions require Shopify Plus. For non-Plus
merchants, I've also implemented a Web Pixel version (checkout-web-pixel.js)
that injects the autocomplete functionality via JavaScript. It provides the
same user experience but uses a different deployment method."
```

### Q: "How does this handle internationalization?"

**A:**
```
"The Swiftcomplete API supports multiple countries. I pass a context parameter
to identify this is a checkout request, and the backend can be enhanced to:
1. Detect the customer's country from checkout
2. Pass country-specific parameters to Swiftcomplete
3. Format addresses according to local conventions
4. The checkout's native country selector would drive the address format"
```

---

## 🐛 **Troubleshooting**

### Issue: Extension doesn't appear in preview

**Solution:**
```bash
# Restart the dev server
shopify app dev --reset
```

### Issue: API calls failing (CORS errors)

**Solution:**
- Ensure your app backend is running (`npm run dev`)
- Check that CORS headers are set in `api.address-autocomplete.search.tsx`
- The mock data fallback should still work to show functionality

### Issue: "No results found"

**Solution:**
- Check console logs to see API response
- Verify your Swiftcomplete API key is configured
- Use mock data fallback to demonstrate UI flow

---

## 📊 **Demo Script** (30 seconds)

Here's a quick script for your demo:

```
1. [Open preview] "This is my Checkout UI Extension running in Shopify's 
   checkout environment."

2. [Show code] "I'm targeting the delivery-address extension point, rendering 
   a React component with the Shopify UI Extensions SDK."

3. [Type in field] "As I type, the component debounces input and calls the 
   Swiftcomplete API through my backend proxy."

4. [Open console] "You can see the API flow in the console - fetching addresses, 
   receiving results, updating the UI."

5. [Click result] "When a user selects an address, it populates the field. 
   In a full implementation, this would also update the checkout address object."

6. [Show error handling] "I've also implemented error handling with mock data 
   fallback, so the demo works even if the API is unavailable."
```

---

## ✅ **Final Checklist Before Interview**

- [ ] Both terminals running (`npm run dev` + `shopify app dev`)
- [ ] Preview URL opens successfully
- [ ] Extension appears in checkout preview
- [ ] Console open (F12) to show logs
- [ ] Code editor open to reference implementation
- [ ] This guide open for talking points
- [ ] Test the flow once before demo

---

## 🎉 **Good Luck!**

You've built a solid implementation that demonstrates:
- ✅ Shopify platform expertise
- ✅ React development skills
- ✅ API integration
- ✅ UX best practices
- ✅ Error handling

**Remember:** Even if something doesn't work perfectly, explaining your thought 
process and showing your code quality is what matters most in an interview!

---

## 📂 **Key Files to Reference**

- **Extension Config:** `extensions/checkout-address-autocomplete/shopify.extension.toml`
- **React Component:** `extensions/checkout-address-autocomplete/src/index.jsx`
- **API Proxy:** `app/routes/api.address-autocomplete.search.tsx`
- **Config Endpoint:** `app/routes/api.checkout-config.tsx`
- **This Guide:** `INTERVIEW_DEMO_GUIDE.md`

