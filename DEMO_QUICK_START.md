# 🚀 Quick Start - Interview Demo

## Run the Demo in 3 Steps

### Terminal 1: Start Backend
```bash
cd "z:\SOURCE CODE\swift-address-autocomplete"
npm run dev
```
✅ Starts Remix app + API endpoints

### Terminal 2: Start Preview
```bash
cd "z:\SOURCE CODE\swift-address-autocomplete"
shopify app dev
```
✅ Opens Shopify checkout preview

### Browser: Test the Extension
1. Click preview URL from Terminal 2
2. Click "Test your app" → "Checkout UI extension"
3. **Type in "Search Address" field:** `123 Main`
4. **See autocomplete suggestions!** 🎉
5. **Open F12** to show console logs

---

## What to Show Recruiter

### 1. **Extension Point** ✅
```
File: extensions/checkout-address-autocomplete/shopify.extension.toml

Shows: I understand Shopify's extension targeting system
```

### 2. **React Component** ✅
```
File: extensions/checkout-address-autocomplete/src/index.jsx

Shows: Clean React code with hooks, state management, error handling
```

### 3. **API Integration** ✅
```
Logs in console show:
- API URL construction
- Fetch request
- Response handling
- Results rendering
```

### 4. **Reactive UI** ✅
```
Type → Debounce → Fetch → Show Loading → Display Results → Click → Populate
```

### 5. **Error Handling** ✅
```
If API fails: Shows mock data fallback (graceful degradation)
```

---

## Console Logs to Point Out

```
[Demo] 🔍 Search triggered with query: 123 Main
[Demo] ⏳ Loading addresses...
[Demo] 📡 Fetching from: http://localhost:3000/api/...
[Demo] 📥 Response status: 200
[Demo] ✅ Received 5 results
[Demo] 📦 Results: [{...}]
[Demo] ✔️ Search complete
```

**Explain:** "You can see the full flow in the console - from input to API call to rendering results."

---

## Quick Demo Script (30 sec)

1. **"This is a Checkout UI Extension"** - Show extension in preview
2. **"Targeting delivery address"** - Show TOML config
3. **"React component with state"** - Show index.jsx
4. **"API integration"** - Type to trigger, show console
5. **"Reactive UI"** - Click result to populate field
6. **"Error handling"** - Mention mock data fallback

---

## If Something Breaks

### Extension not showing?
```bash
shopify app dev --reset
```

### API not working?
✅ **That's OK!** Mock data fallback will still demonstrate the UI flow

### Can't connect to Cloudflare tunnel?
✅ **That's OK!** Point to the code and explain how it would work in production

---

## Key Points to Emphasize

✅ **Platform Knowledge** - Understanding of Checkout UI Extensions  
✅ **React Skills** - Hooks, state management, component architecture  
✅ **API Integration** - Async calls, error handling, debouncing  
✅ **UX** - Loading states, error messages, smooth interactions  
✅ **Code Quality** - Clean, documented, production-ready

---

## 💡 Remember

**The code quality and your explanation matter more than everything working perfectly!**

Even if the API doesn't connect, you can:
- Show the code
- Explain the architecture
- Point to console logs
- Use mock data to demonstrate UI

**You've got this!** 🎉

