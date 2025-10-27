/**
 * Checkout Address Autocomplete - Web Pixel Version
 * 
 * This version automatically fetches configuration from the backend
 * No need to manually set app URL or shop domain!
 * 
 * USAGE:
 * 1. Copy this entire file
 * 2. Go to: Settings → Customer events → Web pixels
 * 3. Click "Add custom pixel"
 * 4. Paste this code
 * 5. Save and enable
 * 
 * That's it! Configuration is fetched automatically.
 */

(function() {
  'use strict';
  
  console.log('[Checkout Address Autocomplete] Initializing Web Pixel...');
  
  // Initial config (will be loaded from backend)
  let CONFIG = {
    apiEndpoint: null,
    shop: null,
    enabled: false,
    minCharacters: 3,
    debounceDelay: 300,
    maxResults: 5,
    context: 'checkout'
  };
  
  // State
  let debounceTimer = null;
  let currentResults = [];
  let selectedIndex = -1;
  let activeInput = null;
  let activeDropdown = null;
  let configLoaded = false;
  
  /**
   * Get shop domain from checkout
   */
  function getShopDomain() {
    // Try to get from Shopify's analytics
    if (window.Shopify && window.Shopify.shop) {
      return window.Shopify.shop;
    }
    
    // Try to get from URL
    const hostname = window.location.hostname;
    if (hostname.includes('.myshopify.com')) {
      return hostname;
    }
    
    // Try to extract from checkout URL
    const match = window.location.href.match(/([^.]+\.myshopify\.com)/);
    if (match) {
      return match[1];
    }
    
    console.error('[Checkout Address Autocomplete] Could not determine shop domain');
    return null;
  }
  
  /**
   * Get possible app URLs to try
   * Returns array of URLs to attempt in order
   */
  function getPossibleAppUrls() {
    const urls = [];
    
    // Method 1: Check if manually configured
    if (window.SWIFTCOMPLETE_APP_URL) {
      urls.push(window.SWIFTCOMPLETE_APP_URL);
      console.log('[Checkout Address Autocomplete] Using manually configured URL:', window.SWIFTCOMPLETE_APP_URL);
    }
    
    // Method 2: Try to find app URL from script tags
    const scripts = document.querySelectorAll('script[src]');
    for (const script of scripts) {
      const src = script.getAttribute('src');
      if (src && src.includes('/apps/')) {
        try {
          const url = new URL(src);
          const appUrl = `${url.protocol}//${url.host}`;
          if (!urls.includes(appUrl)) {
            urls.push(appUrl);
          }
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }
    
    // Method 3: Try Shopify app proxy (same domain)
    urls.push(window.location.origin);
    
    // Method 4: Try common deployment patterns
    const shop = getShopDomain();
    if (shop) {
      const shopName = shop.replace('.myshopify.com', '');
      
      // Fly.io pattern
      urls.push(`https://${shopName}-app.fly.dev`);
      
      // Heroku pattern
      urls.push(`https://${shopName}-app.herokuapp.com`);
      
      // Note: Cloudflare tunnel URLs are random and can't be predicted
      // Users need to set window.SWIFTCOMPLETE_APP_URL for tunnel URLs
    }
    
    return urls;
  }
  
  /**
   * Try to fetch config from a URL
   */
  async function tryFetchConfig(appUrl, shop) {
    try {
      const configUrl = `${appUrl}/api/checkout-config?shop=${encodeURIComponent(shop)}`;
      console.log('[Checkout Address Autocomplete] Trying:', configUrl);
      
      const response = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.config) {
        console.log('[Checkout Address Autocomplete] ✅ Config loaded from:', appUrl);
        return data.config;
      }
      
      return null;
    } catch (error) {
      console.log('[Checkout Address Autocomplete] ❌ Failed to fetch from:', appUrl, error.message);
      return null;
    }
  }
  
  /**
   * Load configuration from backend
   * Tries multiple possible app URLs until one works
   */
  async function loadConfig() {
    const shop = getShopDomain();
    
    if (!shop) {
      console.error('[Checkout Address Autocomplete] Cannot load config: shop domain not found');
      return false;
    }
    
    console.log('[Checkout Address Autocomplete] Shop domain:', shop);
    
    // Get all possible app URLs to try
    const possibleUrls = getPossibleAppUrls();
    console.log('[Checkout Address Autocomplete] Will try', possibleUrls.length, 'possible URLs');
    
    // Try each URL until one works
    for (const appUrl of possibleUrls) {
      const config = await tryFetchConfig(appUrl, shop);
      if (config) {
        CONFIG = { ...CONFIG, ...config };
        configLoaded = true;
        console.log('[Checkout Address Autocomplete] Config loaded successfully!');
        console.log('[Checkout Address Autocomplete] API Endpoint:', CONFIG.apiEndpoint);
        console.log('[Checkout Address Autocomplete] Enabled:', CONFIG.enabled);
        console.log('[Checkout Address Autocomplete] Checkout enabled:', CONFIG.enabledCheckout);
        return true;
      }
    }
    
    // None of the URLs worked
    console.error('[Checkout Address Autocomplete] Failed to load config from any URL');
    console.error('[Checkout Address Autocomplete] Tried URLs:', possibleUrls);
    console.error('[Checkout Address Autocomplete] TIP: Set window.SWIFTCOMPLETE_APP_URL before loading this script');
    return false;
  }
  
  /**
   * Main initialization
   */
  async function init() {
    console.log('[Checkout Address Autocomplete] Starting initialization...');
    
    // Load configuration from backend
    const loaded = await loadConfig();
    
    if (!loaded) {
      console.error('[Checkout Address Autocomplete] Failed to load configuration');
      return;
    }
    
    // Check if feature is enabled
    if (!CONFIG.enabled || !CONFIG.enabledCheckout) {
      console.log('[Checkout Address Autocomplete] Feature is disabled in settings');
      return;
    }
    
    console.log('[Checkout Address Autocomplete] Feature enabled, waiting for checkout form...');
    
    // Wait for checkout form to be available
    try {
      const form = await waitForCheckoutForm();
      const addressInput = findAddressInput(form);
      
      if (addressInput) {
        console.log('[Checkout Address Autocomplete] ✅ Found address input, enhancing...');
        enhanceAddressInput(addressInput);
        console.log('[Checkout Address Autocomplete] 🎉 Initialization complete! Start typing in the address field.');
      } else {
        console.warn('[Checkout Address Autocomplete] ⚠️ Address input not found in form');
        console.warn('[Checkout Address Autocomplete] The checkout page structure may be different. Check the debug logs above.');
      }
    } catch (error) {
      console.error('[Checkout Address Autocomplete] ❌ Initialization failed:', error.message);
      console.error('[Checkout Address Autocomplete] The checkout form was not found. This may not be a checkout page.');
    }
  }
  
  /**
   * Debug: Log available forms and inputs on the page
   */
  function debugPageStructure() {
    console.log('[Checkout Address Autocomplete] 🔍 Debugging page structure...');
    
    // Find all forms
    const forms = document.querySelectorAll('form');
    console.log('[Checkout Address Autocomplete] Found', forms.length, 'forms on page');
    
    forms.forEach((form, index) => {
      console.log(`[Checkout Address Autocomplete] Form ${index}:`, {
        id: form.id,
        className: form.className,
        action: form.action,
        name: form.name
      });
    });
    
    // Find all address-like inputs
    const addressInputs = document.querySelectorAll('input[type="text"]');
    console.log('[Checkout Address Autocomplete] Found', addressInputs.length, 'text inputs');
    
    addressInputs.forEach((input, index) => {
      if (input.name?.includes('address') || 
          input.id?.includes('address') || 
          input.placeholder?.toLowerCase().includes('address')) {
        console.log(`[Checkout Address Autocomplete] Address-like input ${index}:`, {
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          autocomplete: input.getAttribute('autocomplete')
        });
      }
    });
  }
  
  /**
   * Wait for checkout form to be available
   */
  function waitForCheckoutForm() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkForm = () => {
        attempts++;
        
        // Try multiple selectors
        let form = document.querySelector('form[data-customer-addresses]') || 
                   document.querySelector('form[action*="checkout"]') ||
                   document.querySelector('form[data-shopify-checkout-authorization-token]') ||
                   document.querySelector('main form') ||
                   document.querySelector('form');
        
        if (form) {
          console.log('[Checkout Address Autocomplete] ✅ Form found after', attempts, 'attempts');
          console.log('[Checkout Address Autocomplete] Form details:', {
            id: form.id,
            className: form.className,
            action: form.action
          });
          resolve(form);
        } else if (attempts >= maxAttempts) {
          console.error('[Checkout Address Autocomplete] ❌ Form not found after', attempts, 'attempts');
          debugPageStructure();
          reject(new Error('Form not found'));
        } else {
          if (attempts % 10 === 0) {
            console.log('[Checkout Address Autocomplete] Still looking for form... attempt', attempts);
          }
          setTimeout(checkForm, 100);
        }
      };
      
      checkForm();
    });
  }
  
  /**
   * Find address input field in checkout
   */
  function findAddressInput(form) {
    console.log('[Checkout Address Autocomplete] 🔍 Searching for address input in form...');
    
    const selectors = [
      // Direct name matches
      'input[name="address1"]',
      'input[name="address_1"]',
      'input[name="checkout[shipping_address][address1]"]',
      'input[name="checkout[billing_address][address1]"]',
      
      // ID matches
      'input[id*="address1"]',
      'input[id*="address_1"]',
      'input[id*="shipping_address"]',
      'input[id*="TextField"]',
      
      // Autocomplete attribute
      'input[autocomplete="address-line1"]',
      'input[autocomplete="street-address"]',
      
      // Placeholder matches (case insensitive)
      'input[placeholder*="address" i]',
      'input[placeholder*="street" i]',
      
      // Generic text inputs in the form
      'input[type="text"]'
    ];
    
    for (const selector of selectors) {
      const inputs = form.querySelectorAll(selector);
      console.log(`[Checkout Address Autocomplete] Selector "${selector}" found ${inputs.length} inputs`);
      
      for (const input of inputs) {
        // Log details about this input
        console.log('[Checkout Address Autocomplete] Checking input:', {
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          type: input.type,
          autocomplete: input.getAttribute('autocomplete')
        });
        
        // Check if it looks like an address field
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();
        const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
        
        const isAddressField = 
          name.includes('address1') || 
          name.includes('address_1') ||
          id.includes('address1') || 
          id.includes('address_1') ||
          placeholder.includes('address') || 
          placeholder.includes('street') ||
          autocomplete === 'address-line1' ||
          autocomplete === 'street-address';
        
        if (isAddressField && input.type === 'text') {
          console.log('[Checkout Address Autocomplete] ✅ Found address input!', {
            selector: selector,
            name: input.name,
            id: input.id
          });
          return input;
        }
      }
    }
    
    console.error('[Checkout Address Autocomplete] ❌ Address input not found');
    debugPageStructure();
    return null;
  }
  
  /**
   * Enhance address input with autocomplete
   */
  function enhanceAddressInput(input) {
    if (input.dataset.autocompleteEnhanced === 'true') {
      console.log('[Checkout Address Autocomplete] Already enhanced');
      return;
    }
    
    input.dataset.autocompleteEnhanced = 'true';
    activeInput = input;
    
    // Create dropdown
    activeDropdown = createDropdown(input);
    
    // Attach event listeners
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('focus', handleFocus);
    
    console.log('[Checkout Address Autocomplete] Enhancement complete');
  }
  
  /**
   * Create dropdown element
   */
  function createDropdown(input) {
    const dropdown = document.createElement('div');
    dropdown.className = 'checkout-autocomplete-dropdown';
    dropdown.id = 'checkout-autocomplete-dropdown';
    
    // Inject styles
    injectStyles();
    
    // Position dropdown
    const wrapper = input.parentElement;
    wrapper.style.position = 'relative';
    wrapper.appendChild(dropdown);
    
    return dropdown;
  }
  
  /**
   * Inject styles for dropdown
   */
  function injectStyles() {
    if (document.getElementById('checkout-autocomplete-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'checkout-autocomplete-styles';
    style.textContent = `
      .checkout-autocomplete-dropdown {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        max-height: 300px;
        overflow-y: auto;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      
      .checkout-autocomplete-item {
        padding: 12px 16px;
        cursor: pointer;
        transition: background-color 0.15s ease;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .checkout-autocomplete-item:last-child {
        border-bottom: none;
      }
      
      .checkout-autocomplete-item:hover,
      .checkout-autocomplete-item.active {
        background-color: #f3f4f6;
      }
      
      .checkout-autocomplete-item-main {
        font-size: 14px;
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
      }
      
      .checkout-autocomplete-item-sub {
        font-size: 12px;
        color: #6b7280;
      }
      
      .checkout-autocomplete-loading,
      .checkout-autocomplete-error,
      .checkout-autocomplete-empty {
        padding: 16px;
        text-align: center;
        font-size: 14px;
        color: #6b7280;
      }
      
      .checkout-autocomplete-error {
        color: #dc2626;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Handle input event
   */
  function handleInput(e) {
    const query = e.target.value.trim();
    
    if (query.length < CONFIG.minCharacters) {
      hideDropdown();
      return;
    }
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchAddress(query);
    }, CONFIG.debounceDelay);
  }
  
  /**
   * Handle keydown for keyboard navigation
   */
  function handleKeyDown(e) {
    if (!activeDropdown || activeDropdown.style.display === 'none') {
      return;
    }
    
    const items = activeDropdown.querySelectorAll('.checkout-autocomplete-item');
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection(items);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        updateSelection(items);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && currentResults[selectedIndex]) {
          selectAddress(currentResults[selectedIndex]);
        }
        break;
        
      case 'Escape':
        hideDropdown();
        break;
    }
  }
  
  /**
   * Handle blur event
   */
  function handleBlur() {
    setTimeout(() => hideDropdown(), 200);
  }
  
  /**
   * Handle focus event
   */
  function handleFocus() {
    if (currentResults.length > 0) {
      showDropdown();
    }
  }
  
  /**
   * Search for addresses via API
   */
  async function searchAddress(query) {
    if (!configLoaded || !CONFIG.apiEndpoint) {
      console.error('[Checkout Address Autocomplete] Config not loaded');
      return;
    }
    
    try {
      showLoading();
      
      const url = `${CONFIG.apiEndpoint}&q=${encodeURIComponent(query)}&context=${CONFIG.context}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      currentResults = data.results || [];
      selectedIndex = -1;
      
      displayResults(currentResults);
      
    } catch (error) {
      console.error('[Checkout Address Autocomplete] Search error:', error);
      showError('Failed to load address suggestions');
    }
  }
  
  /**
   * Display results in dropdown
   */
  function displayResults(results) {
    if (!activeDropdown) return;
    
    activeDropdown.innerHTML = '';
    
    if (results.length === 0) {
      activeDropdown.innerHTML = '<div class="checkout-autocomplete-empty">No addresses found</div>';
      showDropdown();
      return;
    }
    
    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'checkout-autocomplete-item';
      if (index === 0) {
        item.classList.add('active');
        selectedIndex = 0;
      }
      
      const mainText = result.address || result.fullText || 'Unknown Address';
      const subParts = [result.city, result.state, result.zip, result.country].filter(Boolean);
      const subText = subParts.join(', ');
      
      item.innerHTML = `
        <div class="checkout-autocomplete-item-main">${escapeHtml(mainText)}</div>
        ${subText ? `<div class="checkout-autocomplete-item-sub">${escapeHtml(subText)}</div>` : ''}
      `;
      
      item.addEventListener('click', () => {
        selectAddress(result);
      });
      
      activeDropdown.appendChild(item);
    });
    
    showDropdown();
  }
  
  /**
   * Select an address and populate form fields
   */
  function selectAddress(address) {
    if (!activeInput) return;
    
    console.log('[Checkout Address Autocomplete] Selected address:', address);
    
    // Fill address1 field
    activeInput.value = address.address || address.fullText || '';
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Find form and fill other fields
    const form = activeInput.closest('form') || document;
    
    fillField(form, 'city', address.city);
    fillField(form, 'province', address.state);
    fillField(form, 'zip', address.zip);
    fillCountryField(form, address.country);
    
    hideDropdown();
  }
  
  /**
   * Fill a form field
   */
  function fillField(form, fieldName, value) {
    if (!value) return;
    
    const patterns = [
      `[name="${fieldName}"]`,
      `[name="checkout[shipping_address][${fieldName}]"]`,
      `[name="checkout[billing_address][${fieldName}]"]`,
      `[id*="${fieldName}"]`
    ];
    
    for (const pattern of patterns) {
      const field = form.querySelector(`input${pattern}, select${pattern}`);
      if (field) {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`[Checkout Address Autocomplete] Filled ${fieldName}:`, value);
        return;
      }
    }
  }
  
  /**
   * Fill country field with 2-character code handling
   */
  function fillCountryField(form, countryCode) {
    if (!countryCode) return;
    
    const patterns = [
      '[name="country"]',
      '[name="checkout[shipping_address][country]"]',
      '[name="checkout[billing_address][country]"]',
      '[id*="country"]'
    ];
    
    for (const pattern of patterns) {
      const field = form.querySelector(`select${pattern}`);
      if (field && field.tagName === 'SELECT') {
        const code = countryCode.toUpperCase();
        
        let option = Array.from(field.options).find(opt => opt.value === code);
        
        if (!option) {
          option = Array.from(field.options).find(opt => 
            opt.value.toUpperCase() === code ||
            opt.text.toUpperCase().includes(code)
          );
        }
        
        if (option) {
          field.value = option.value;
          field.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`[Checkout Address Autocomplete] Set country to: ${option.value}`);
        }
        return;
      }
    }
  }
  
  /**
   * Update selection UI
   */
  function updateSelection(items) {
    items.forEach((item, i) => {
      if (i === selectedIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }
  
  /**
   * Show/hide dropdown
   */
  function showDropdown() {
    if (activeDropdown) {
      activeDropdown.style.display = 'block';
    }
  }
  
  function hideDropdown() {
    if (activeDropdown) {
      activeDropdown.style.display = 'none';
    }
    currentResults = [];
    selectedIndex = -1;
  }
  
  /**
   * Show loading state
   */
  function showLoading() {
    if (!activeDropdown) return;
    activeDropdown.innerHTML = '<div class="checkout-autocomplete-loading">Loading...</div>';
    activeDropdown.style.display = 'block';
  }
  
  /**
   * Show error message
   */
  function showError(message) {
    if (!activeDropdown) return;
    activeDropdown.innerHTML = `<div class="checkout-autocomplete-error">${escapeHtml(message)}</div>`;
    activeDropdown.style.display = 'block';
  }
  
  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose for debugging
  window.CheckoutAddressAutocomplete = {
    config: CONFIG,
    reinit: init,
    currentResults: () => currentResults,
    configLoaded: () => configLoaded
  };
  
})();

