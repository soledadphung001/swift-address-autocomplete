# Swift Address Autocomplete

A Shopify app that provides intelligent address autocomplete functionality powered by the Swiftcomplete API. Monetize address lookups at $0.03 per API call with built-in usage tracking and billing.

## 🎯 Features

- ✅ **Address Autocomplete** - Real-time address suggestions as customers type
- ✅ **Profile Page Support** - Works on customer account address forms (including popups)
- ✅ **Swiftcomplete Integration** - Powered by Swiftcomplete's global address database
- ✅ **Usage Tracking** - Track every API call for billing ($0.03/lookup)
- ✅ **Admin Dashboard** - Configure API keys, view usage statistics
- ✅ **Theme App Extension** - Easy merchant setup via theme editor
- ✅ **Auto-fill Forms** - Automatically populates address, city, state, zip, country fields
- ✅ **Multi-country Support** - 40+ countries with ISO code to name mapping
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Dark Mode** - Adapts to user preferences

## 📋 Tech Stack

- **Backend**: Remix (React framework)
- **Database**: Prisma with SQLite (dev) / PostgreSQL (production ready)
- **UI**: Shopify Polaris components
- **Frontend**: Vanilla JavaScript for theme extension
- **API**: Swiftcomplete REST API
- **Styling**: CSS with modern design

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│  Shopify Storefront             │
│  - Customer Account Pages       │
│  - Address Forms (Popups)       │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Theme App Extension            │
│  - MutationObserver for popups  │
│  - Autocomplete dropdown        │
│  - Form auto-fill logic         │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Remix Backend API              │
│  - Proxy to Swiftcomplete       │
│  - Usage tracking & billing     │
│  - Settings management          │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Swiftcomplete API              │
│  - Global address database      │
│  - Real-time suggestions        │
└─────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.20+ or 20.10+ or 21+
- Shopify Partner account
- Shopify development store
- Swiftcomplete API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd swift-address-autocomplete
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Configure the app**
   - Open the app in Shopify admin
   - Go to "Address Autocomplete" settings
   - Enter your Swiftcomplete API key
   - Save settings

6. **Deploy extension**
   ```bash
   npm run deploy
   ```

7. **Enable in theme**
   - Go to Online Store → Themes → Customize
   - Click "App Embeds" (bottom left)
   - Enable "Swift Address Autocomplete"
   - Save theme

## 📁 Project Structure

```
swift-address-autocomplete/
├── app/
│   ├── routes/
│   │   ├── app.address-autocomplete.tsx    # Admin settings page
│   │   ├── api.address-autocomplete.search.tsx  # API proxy
│   │   └── ...
│   ├── db.server.ts                         # Prisma client
│   └── shopify.server.ts                    # Shopify auth
├── extensions/
│   └── address-autocomplete/
│       ├── assets/
│       │   ├── address-autocomplete.js      # Main logic (MutationObserver)
│       │   └── address-autocomplete.css     # Dropdown styling
│       ├── blocks/
│       │   └── app-embed.liquid             # App embed block
│       └── locales/
│           └── en.default.json              # Translations
├── prisma/
│   ├── schema.prisma                        # Database schema
│   └── migrations/                          # Database migrations
├── IMPLEMENTATION_SUMMARY.md                # Technical overview
├── TESTING_GUIDE.md                         # How to test
└── ADDRESS_AUTOCOMPLETE_README.md           # Detailed docs
```

## 🔧 Key Components

### 1. Admin Settings (`app/routes/app.address-autocomplete.tsx`)

**Built with**: Shopify Polaris + App Bridge + Remix

```typescript
// Features:
- Swiftcomplete API key configuration
- Enable/disable per location (checkout, profile)
- Usage statistics (last 30 days)
- Pricing configuration ($0.03/lookup)
- Installation instructions
```

**Technologies**: React, TypeScript, Polaris components, Remix actions/loaders

### 2. API Proxy (`app/routes/api.address-autocomplete.search.tsx`)

**Purpose**: Secure proxy between storefront and Swiftcomplete

```typescript
// Flow:
1. Receives query from storefront
2. Fetches API key from database
3. Calls Swiftcomplete API
4. Tracks usage in AddressLookup table
5. Returns formatted results

// Security:
- API key never exposed to frontend
- CORS headers for public access
- Usage tracking for billing
```

### 3. Theme Extension (`extensions/address-autocomplete/`)

**JavaScript Features**:
- **MutationObserver**: Detects dynamic popups
- **Debounced search**: Optimized API calls
- **Keyboard navigation**: Arrow keys, Enter, Escape
- **Form auto-fill**: Smart field detection
- **Country mapping**: ISO codes to full names

**CSS Features**:
- Modern dropdown design
- Mobile responsive
- Dark mode support
- Smooth animations

### 4. Database Schema (`prisma/schema.prisma`)

```prisma
// SwiftcompleteSettings
- shop, apiKey, enabled
- enabledCheckout, enabledProfile
- chargePerLookup, maxMonthlyCharge

// AddressLookup (Usage Tracking)
- shop, customerId, query
- resultCount, charged, chargeAmount
- createdAt
```

## 🎨 Shopify CLI Workflow

### Scaffold New Features

```bash
# Generate new extension
shopify app generate extension

# Generate GraphQL types
npm run graphql-codegen
```

### Preview & Development

```bash
# Start dev server with hot reload
npm run dev

# Preview in browser
# Opens: https://admin.shopify.com/store/YOUR_STORE/apps/swift-address-autocomplete
```

### Deploy

```bash
# Deploy extension to production
npm run deploy

# Build for production
npm run build
```

## 💰 Monetization Model

- **$0.03 per address lookup**
- Usage tracked in `AddressLookup` table
- Ready for Shopify Billing API integration
- Capped monthly charges configurable

### Implementation (Future):

```typescript
// Add Shopify Billing API
import { billing } from "@shopify/shopify-app-remix";

// Create usage charge
await billing.request({
  plan: "usage",
  amount: 0.03,
  terms: "Address lookup"
});
```

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Test**:
1. Go to storefront as logged-in customer
2. Navigate to Account → Addresses
3. Click "Add new address"
4. Type in address field
5. See autocomplete dropdown
6. Select address → form auto-fills

## 📚 Documentation

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete overview
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Step-by-step testing
- **[ADDRESS_AUTOCOMPLETE_README.md](./ADDRESS_AUTOCOMPLETE_README.md)** - Technical details
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

## 🔐 Security

- ✅ API keys stored securely in database
- ✅ Backend proxy pattern (key never exposed to frontend)
- ✅ HTTPS for all API calls
- ✅ XSS protection with HTML escaping
- ✅ CORS headers for controlled access
- ✅ Usage tracking for abuse prevention

## 🌍 Supported Countries

40+ countries including:
- 🇺🇸 United States
- 🇨🇦 Canada
- 🇬🇧 United Kingdom
- 🇦🇺 Australia
- 🇸🇬 Singapore
- 🇩🇪 Germany
- 🇫🇷 France
- And many more...

See `countryCodeToName` mapping in `address-autocomplete.js`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software for Swiftcomplete address autocomplete services.

## 🆘 Support

- **Documentation**: Check the docs folder
- **Issues**: Open a GitHub issue
- **Email**: your-support@email.com

## 🎯 Roadmap

- [ ] Checkout UI Extension (for checkout pages)
- [ ] Shopify Billing API integration
- [ ] Address validation (not just autocomplete)
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Custom address formats per country

---

**Built with ❤️ for Shopify merchants**
