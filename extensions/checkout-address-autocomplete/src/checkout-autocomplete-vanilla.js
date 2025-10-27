/**
 * Checkout Address Autocomplete - Vanilla JavaScript Version
 * 
 * This version works without UI Extensions SDK for maximum compatibility
 * Can be injected via checkout.liquid or custom pixel
 * 
 * USAGE:
 * 1. Via checkout.liquid (Shopify Plus):
 *    <script src="{{ 'checkout-autocomplete-vanilla.js' | asset_url }}" defer></script>
 * 
 * 2. Via Custom Pixel or Web Pixel:
 *    Load this script in your web pixel configuration
 * 
 * KEY FEATURES:
 * - Enhances existing address1 field (no new fields!)
 * - Handles 2-character country codes (US, CA, etc.)
 * - Respects enabledCheckout setting
 * - Works with Shopify checkout field patterns
 */

(function() {
  'use strict';
  
  // Configuration - will be injected by backend or set via global config
  const CONFIG = window.CheckoutAutocompleteConfig || {
    apiEndpoint: '/apps/proxy/address-autocomplete/search',
    shop: window.Shopify?.shop || '',
    enabled: true,
    minCharacters: 3,
    debounceDelay: 300,
    maxResults: 5,
    context: 'checkout' // Explicitly set context for checkout pages
  };
  
  // Check if feature is enabled
  if (!CONFIG.enabled || !CONFIG.shop) {
    console.log('[Checkout Address Autocomplete] Not enabled or shop not configured');
    return;
  }
  
  // Build API endpoint with shop parameter
  const API_URL = `${CONFIG.apiEndpoint}${CONFIG.apiEndpoint.includes('?') ? '&' : '?'}shop=${CONFIG.shop}`;
  
  console.log('[Checkout Address Autocomplete] Initializing for shop:', CONFIG.shop);
  
  // State
  let debounceTimer = null;
  let currentResults = [];
  let selectedIndex = -1;
  let activeInput = null;
  let activeDropdown = null;
  
  /**
   * Initialize when DOM is ready
   */
  function init() {
    // Wait for checkout form to be available
    waitForCheckoutForm().then(form => {
      const addressInput = findAddressInput(form);
      if (addressInput) {
        console.log('[Checkout Address Autocomplete] Found address input, enhancing...');
        enhanceAddressInput(addressInput);
      } else {
        console.warn('[Checkout Address Autocomplete] Address input not found');
      }
    });
  }
  
  /**
   * Wait for checkout form to be available
   */
  function waitForCheckoutForm() {
    return new Promise((resolve) => {
      const checkForm = () => {
        const form = document.querySelector('form[data-customer-addresses]') || 
                     document.querySelector('form[action*="checkout"]') ||
                     document.querySelector('main form');
        
        if (form) {
          resolve(form);
        } else {
          setTimeout(checkForm, 100);
        }
      };
      
      checkForm();
    });
  }
  
  /**
   * Find address input field in checkout
   * Tries multiple selectors to handle different Shopify checkout versions
   */
  function findAddressInput(form) {
    const selectors = [
      // Standard checkout field names
      'input[name="address1"]',
      'input[name="checkout[shipping_address][address1]"]',
      'input[name="checkout[billing_address][address1]"]',
      
      // ID-based selectors
      'input[id*="checkout_shipping_address_address1"]',
      'input[id*="checkout_billing_address_address1"]',
      'input[id*="TextField"][id*="address1"]',
      
      // Autocomplete attribute
      'input[autocomplete="address-line1"]',
      'input[autocomplete="street-address"]',
      
      // Generic fallback
      'input[placeholder*="Address"]',
      'input[placeholder*="Street"]'
    ];
    
    for (const selector of selectors) {
      const input = form.querySelector(selector);
      if (input && input.type === 'text') {
        console.log('[Checkout Address Autocomplete] Found via selector:', selector);
        return input;
      }
    }
    
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
    try {
      showLoading();
      
      const url = `${API_URL}&q=${encodeURIComponent(query)}&context=${CONFIG.context}`;
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
   * IMPORTANT: Checkout uses 2-char codes like "US", not "United States"
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
        // Checkout uses 2-character codes
        const code = countryCode.toUpperCase();
        
        // Try exact match first (e.g., "US")
        let option = Array.from(field.options).find(opt => opt.value === code);
        
        // If not found, try to find by partial match
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
        } else {
          console.warn(`[Checkout Address Autocomplete] Country code not found: ${code}`);
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
    currentResults: () => currentResults
  };
  
})();

