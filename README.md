# Swift Address Autocomplete (Checkout UI Extension)

A Shopify app that adds intelligent address autocomplete to Checkout using a Checkout UI Extension and a secure backend proxy to Swiftcomplete API.

## 🎯 What's Included

- ✅ **Checkout UI Extension** - Real-time address suggestions during checkout
- ✅ **Admin Settings Page** - Configure Swiftcomplete API key, enable/disable checkout feature
- ✅ **Secure Backend Proxy** - Your Swiftcomplete API key is never exposed to the frontend
- ✅ **Automatic URL Injection** - No hardcoded URLs; works for every developer automatically
- ✅ **Usage Tracking** - Track every API call for billing purposes
- ✅ **Debounced Search** - Optimized API calls with 300ms debounce
- ✅ **Keyboard Navigation** - Arrow keys, Enter, Escape support
- ✅ **Multi-country Support** - 40+ countries supported

## 🧰 Tech Stack

- **Backend**: Remix (Node.js + Express)
- **Database**: Prisma ORM + SQLite (dev) / PostgreSQL (production-ready)
- **Admin UI**: Shopify Polaris components
- **Extension**: @shopify/ui-extensions-react
- **API**: Swiftcomplete REST API

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│  Shopify Checkout Page          │
│  - Delivery Address Form        │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Checkout UI Extension          │
│  - React component              │
│  - Debounced input handler      │
│  - Autocomplete dropdown        │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Remix Backend API              │
│  - /api/address-autocomplete    │
│  - Settings validation          │
│  - Usage tracking               │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Swiftcomplete API              │
│  - Global address database      │
│  - Real-time suggestions        │
└─────────────────────────────────┘
```

## 🚀 Setup & Installation

### Prerequisites

- **Node.js**: 18.20+ or 20.10+ or 21+
- **Shopify Partner Account**: [Create one here](https://partners.shopify.com/)
- **Shopify Development Store**: Create from Partner Dashboard
- **Swiftcomplete API Key**: Get from [Swiftcomplete](https://swiftcomplete.com/)

### Step-by-Step Setup

#### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd swift-address-autocomplete

# Install dependencies
npm install
```

#### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

This creates a SQLite database at `prisma/dev.sqlite` with the following tables:
- `Session` - Shopify app session storage
- `SwiftcompleteSettings` - API key and feature toggles
- `AddressLookup` - Usage tracking

#### 3. Start Development Server

```bash
npm run dev
```

**What happens:**
- Shopify CLI starts a Cloudflare tunnel (e.g., `https://xxx.trycloudflare.com`)
- Sets `SHOPIFY_APP_URL` environment variable automatically
- Runs `scripts/gen-env.cjs` to inject the app URL into `extensions/checkout-address-autocomplete/src/app-origin.js`
- Opens the Dev Console in your browser

#### 4. Connect to Your Store

When you run `npm run dev` for the first time:

1. **CLI prompts you to select/create a store**
   - Choose your development store
   - CLI creates the app in your Partner Dashboard automatically

2. **Install the app on your store**
   - Click the installation link in the CLI output
   - Approve the app permissions
   - The app is now installed!

#### 5. Configure Swiftcomplete API Key

1. In your store admin, open the app
2. Click **"Address Autocomplete"** in the app navigation
3. Enter your **Swiftcomplete API key**
4. Toggle **"Enable Checkout pages"** ON
5. Click **Save**

#### 6. Preview the Checkout Extension

**Option A: Via Dev Console (default)**
1. The CLI opens the Dev Console: `https://xxx.trycloudflare.com/extensions/dev-console`
2. Find **"address-autocomplete-checkout"** in the extension list
3. Click the **Preview** link
4. Bookmark this URL for direct access next time

**Option B: Direct Preview Link**
- Copy the preview URL from the Dev Console
- Format: `https://admin.shopify.com/store/<your-store>/checkouts/editor/extensions/<extension-id>`
- Bookmark and open directly

## 🧩 How Automatic URL Injection Works

**Problem:** The extension needs the app's HTTPS URL, which changes for every developer and environment.

**Solution:** Build-time injection via `gen-env.cjs`

1. **Shopify CLI sets `SHOPIFY_APP_URL`**
   ```bash
   # Example during npm run dev
   SHOPIFY_APP_URL=https://abc-xyz.trycloudflare.com
   ```

2. **Build script generates `app-origin.js`**
   ```javascript
   // scripts/gen-env.cjs runs before extension build
   const fs = require('fs');
   const appUrl = process.env.SHOPIFY_APP_URL || 'https://fallback.com';
   fs.writeFileSync(
     'extensions/checkout-address-autocomplete/src/app-origin.js',
     `export const APP_ORIGIN = '${appUrl}';`
   );
   ```

3. **Extension imports APP_ORIGIN**
   ```javascript
   // extensions/checkout-address-autocomplete/src/index.jsx
   import { APP_ORIGIN } from './app-origin';
   
   const apiEndpoint = `${APP_ORIGIN}/api/address-autocomplete/search`;
   ```

**Result:** No hardcoding! Works for any developer, any environment, zero manual config.

## 📁 Project Structure

```
swift-address-autocomplete/
├── app/
│   ├── routes/
│   │   ├── app.address-autocomplete.tsx          # Admin settings page
│   │   ├── api.address-autocomplete.search.tsx   # Secure API proxy
│   │   ├── app._index.tsx                        # Dashboard
│   │   └── ...
│   ├── db.server.ts                               # Prisma client
│   └── shopify.server.ts                          # Shopify authentication
│
├── extensions/
│   └── checkout-address-autocomplete/
│       ├── shopify.extension.toml                 # Extension config
│       ├── package.json                           # Extension dependencies
│       └── src/
│           ├── index.jsx                          # Main React component
│           └── app-origin.js                      # Generated (by gen-env.cjs)
│
├── scripts/
│   └── gen-env.cjs                                # Injects SHOPIFY_APP_URL
│
├── prisma/
│   ├── schema.prisma                              # Database schema
│   ├── dev.sqlite                                 # SQLite database (dev)
│   └── migrations/                                # Database migrations
│
├── package.json                                   # Root dependencies & scripts
├── shopify.app.toml                               # Main app config
└── TESTING_GUIDE_CHECKOUT.md                      # Testing guide
```

## 🔒 Backend API Route

**File:** `app/routes/api.address-autocomplete.search.tsx`

**Flow:**
1. Receives `?shop=...&q=...&context=checkout` from extension
2. Fetches `SwiftcompleteSettings` from database for the shop
3. Validates:
   - `enabled` is true
   - `enabledCheckout` is true (for checkout context)
   - API key exists
4. Calls Swiftcomplete API with the query
5. Tracks usage in `AddressLookup` table
6. Returns formatted results with CORS headers

**Security:**
- API key stored securely in database
- Never exposed to frontend
- CORS enabled for `extensions.shopifycdn.com` (extension sandbox)

## 🧪 Testing

See **[TESTING_GUIDE_CHECKOUT.md](./TESTING_GUIDE_CHECKOUT.md)** for comprehensive testing scenarios.

### Quick Smoke Test

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Open checkout preview**
   - Click the "address-autocomplete-checkout" preview link

3. **Test autocomplete**
   - Type "123 Main" in the address field
   - See dropdown with suggestions
   - Select a suggestion
   - Verify the input updates

4. **Check console logs**
   - Open browser DevTools → Console
   - Look for `[Demo]` prefixed logs showing:
     - Extension initialization
     - API calls
     - Search results

## 📦 Deployment

### Deploy Extension

```bash
npm run deploy
```

This deploys the extension to Shopify. After deployment:

1. **Enable in Checkout Editor**
   - Go to **Settings → Checkout** in Shopify Admin
   - Click **Customize**
   - Add the "Address Autocomplete" extension
   - Save

2. **Test on live checkout**
   - Create a test order in your store
   - Proceed to checkout
   - Test the autocomplete feature

### Deploy Backend

The Remix backend can be deployed to:
- **Shopify-hosted** (via CLI: `shopify app deploy`)
- **Custom hosting** (Render, Railway, Fly.io, etc.)

## 🎨 Key Components

### 1. Admin Settings Page

**File:** `app/routes/app.address-autocomplete.tsx`

**Features:**
- Swiftcomplete API key input (masked)
- Enable/disable toggles (Checkout, Profile)
- Usage statistics (last 30 days)
- Pricing info ($0.03/lookup)
- Installation instructions

**Technologies:** React, TypeScript, Polaris, Remix loaders/actions

### 2. Checkout UI Extension

**File:** `extensions/checkout-address-autocomplete/src/index.jsx`

**Features:**
- React component using `@shopify/ui-extensions-react`
- Renders before native delivery address form
- Debounced input (300ms)
- Dropdown with keyboard navigation
- Auto-focus on first result
- Mock data fallback for demo

**Key Hooks:**
- `useApi()` - Access shop domain
- `useState()` - Manage query, results, loading
- `useEffect()` - Debounced search
- `useCallback()` - Memoized handlers

### 3. Database Schema

**File:** `prisma/schema.prisma`

```prisma
model SwiftcompleteSettings {
  id               String   @id @default(cuid())
  shop             String   @unique
  apiKey           String?
  enabled          Boolean  @default(true)
  enabledCheckout  Boolean  @default(false)
  enabledProfile   Boolean  @default(false)
  chargePerLookup  Float    @default(0.03)
  maxMonthlyCharge Float    @default(100.0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model AddressLookup {
  id           String   @id @default(cuid())
  shop         String
  customerId   String?
  query        String
  resultCount  Int      @default(0)
  charged      Boolean  @default(false)
  chargeAmount Float    @default(0.0)
  createdAt    DateTime @default(now())
}
```

## 🌍 Supported Countries

40+ countries including:
- 🇺🇸 United States
- 🇨🇦 Canada
- 🇬🇧 United Kingdom
- 🇦🇺 Australia
- 🇸🇬 Singapore
- 🇩🇪 Germany
- 🇫🇷 France
- 🇯🇵 Japan
- And many more...

## 💡 Take-Home Assignment Notes

This implementation demonstrates:

✅ **Checkout UI Extension Target**
- Correct extension point: `purchase.checkout.delivery-address.render-before`
- Proper TOML configuration with `targeting` array

✅ **Component Rendering**
- React component with Shopify UI Extensions hooks
- TextField with debounced input
- Pressable list items for suggestions
- Loading and empty states

✅ **API Integration**
- Secure backend proxy to Swiftcomplete
- HTTPS URLs automatically injected
- CORS-friendly from extension sandbox

✅ **Reactive UI**
- Real-time search as user types
- Keyboard navigation (arrows, Enter, Escape)
- Selection updates input field
- Console logging for demo visibility

✅ **Production-Ready Patterns**
- No hardcoded URLs
- Settings validation
- Usage tracking
- Error handling with fallbacks

## 🔐 Security Best Practices

- ✅ API keys stored in database (never in code)
- ✅ Backend proxy pattern (key never sent to frontend)
- ✅ HTTPS enforced for all requests
- ✅ CORS headers properly configured
- ✅ Input validation on API routes
- ✅ Usage tracking for abuse prevention

## 📝 License

This project is proprietary software for Swiftcomplete address autocomplete services.

## 🆘 Support & Contact

- **Author**: Phung Tran
- **LinkedIn**: [Phụng Trần](https://www.linkedin.com/in/ph%E1%BB%A5ng-tr%E1%BA%A7n-7820a5b7/)
- **Email**: phungthaouit@gmail.com
- **Documentation**: See `TESTING_GUIDE_CHECKOUT.md`

## 📚 Additional Resources

- [Shopify Checkout UI Extensions Docs](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Swiftcomplete API Docs](https://swiftcomplete.com/docs)
- [Remix Framework Docs](https://remix.run/docs)
- [Prisma ORM Docs](https://www.prisma.io/docs)

