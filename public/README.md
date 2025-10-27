# Public Assets

This folder contains static assets that are served directly by the app.

## Files

- `favicon.ico` - App favicon
- `checkout-screenshot.png` - Screenshot of the address autocomplete in checkout (to be added)

## How to Add the Checkout Screenshot

1. **Download the image** from ImgBB:
   - Go to: https://i.ibb.co/nsL9xGc/checkout-screenshot.png
   - Right-click → Save Image As...

2. **Save it to this folder** as:
   ```
   public/checkout-screenshot.png
   ```

3. **Verify** the file path:
   ```
   swift-address-autocomplete/
   └── public/
       ├── favicon.ico
       └── checkout-screenshot.png  ← Should be here
   ```

4. **Restart the dev server** (if running):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

5. **Check the admin page** - the image should now load from your local server

## How Static Files Work

Files in the `public/` folder are served at the root URL:
- `public/favicon.ico` → `https://yourapp.com/favicon.ico`
- `public/checkout-screenshot.png` → `https://yourapp.com/checkout-screenshot.png`

The admin page (`app/routes/app._index.tsx`) references it as:
```tsx
<img src="/checkout-screenshot.png" alt="..." />
```

