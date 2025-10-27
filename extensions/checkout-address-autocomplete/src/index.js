/**
 * Checkout Address Autocomplete Extension
 * 
 * This extension adds address autocomplete functionality to Shopify Checkout
 * It integrates with the Swiftcomplete API via a proxy endpoint
 * 
 * Key Features:
 * - Enhances existing address1 field (no new fields needed)
 * - Handles 2-character country codes (US, CA, etc.)
 * - Respects enabledCheckout setting from admin
 * - Works with all checkout field variations
 */

import { extension } from '@shopify/ui-extensions/checkout';

// Configuration
const CONFIG = {
  apiEndpoint: '/apps/proxy/address-autocomplete/search',
  minCharacters: 3,
  debounceDelay: 300,
  maxResults: 5
};

// Main extension
export default extension('purchase.checkout.delivery-address.render-after', (root, api) => {
  const { shop, extensionPoint } = api;
  
  // Initialize the extension
  console.log('[Checkout Address Autocomplete] Initializing...', { shop, extensionPoint });
  
  // Get shop domain for API calls
  const shopDomain = shop?.domain || window.Shopify?.shop;
  
  if (!shopDomain) {
    console.error('[Checkout Address Autocomplete] Shop domain not available');
    return;
  }
  
  // Set up API endpoint with shop parameter
  CONFIG.apiEndpoint = `${CONFIG.apiEndpoint}?shop=${shopDomain}`;
  
  // Wait for DOM to be ready, then enhance address fields
  if (typeof document !== 'undefined') {
    initCheckoutAutocomplete();
  }
});

/**
 * Initialize checkout autocomplete
 */
function initCheckoutAutocomplete() {
  // Wait for checkout form to be ready
  const observer = new MutationObserver((mutations, obs) => {
    const addressInput = findCheckoutAddressInput();
    if (addressInput) {
      enhanceAddressField(addressInput);
      obs.disconnect();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also try immediately in case form is already loaded
  const addressInput = findCheckoutAddressInput();
  if (addressInput) {
    enhanceAddressField(addressInput);
  }
}

/**
 * Find the address1 input field in checkout
 * Handles various Shopify checkout field patterns
 */
function findCheckoutAddressInput() {
  const selectors = [
    'input[name="address1"]',
    'input[name="checkout[shipping_address][address1]"]',
    'input[id*="checkout_shipping_address_address1"]',
    'input[id*="TextField"][id*="address1"]',
    'input[autocomplete="address-line1"]',
    'input[autocomplete="street-address"]'
  ];
  
  for (const selector of selectors) {
    const input = document.querySelector(selector);
    if (input) {
      console.log('[Checkout Address Autocomplete] Found address input:', selector);
      return input;
    }
  }
  
  return null;
}

/**
 * Enhance an address field with autocomplete
 */
function enhanceAddressField(input) {
  if (input.dataset.autocompleteEnhanced === 'true') {
    console.log('[Checkout Address Autocomplete] Field already enhanced');
    return;
  }
  
  console.log('[Checkout Address Autocomplete] Enhancing field...');
  input.dataset.autocompleteEnhanced = 'true';
  
  // Create dropdown
  const dropdown = createDropdown(input);
  
  // State
  let debounceTimer = null;
  let results = [];
  let selectedIndex = -1;
  
  // Event handlers
  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    if (query.length < CONFIG.minCharacters) {
      hideDropdown(dropdown);
      return;
    }
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchAddress(query, input, dropdown, (res) => {
        results = res;
        selectedIndex = -1;
      });
    }, CONFIG.debounceDelay);
  });
  
  input.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') return;
    
    const items = dropdown.querySelectorAll('.checkout-autocomplete-item');
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection(items, selectedIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        updateSelection(items, selectedIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectAddress(input, results[selectedIndex]);
          hideDropdown(dropdown);
        }
        break;
        
      case 'Escape':
        hideDropdown(dropdown);
        break;
    }
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => hideDropdown(dropdown), 200);
  });
  
  console.log('[Checkout Address Autocomplete] Field enhanced successfully');
}

/**
 * Create dropdown element
 */
function createDropdown(input) {
  const dropdown = document.createElement('div');
  dropdown.className = 'checkout-autocomplete-dropdown';
  dropdown.style.cssText = `
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  const wrapper = input.parentElement;
  wrapper.style.position = 'relative';
  wrapper.appendChild(dropdown);
  
  return dropdown;
}

/**
 * Search for addresses
 */
async function searchAddress(query, input, dropdown, onResults) {
  try {
    showLoading(dropdown);
    
    const url = `${CONFIG.apiEndpoint}&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    onResults(results);
    displayResults(dropdown, results, input);
    
  } catch (error) {
    console.error('[Checkout Address Autocomplete] Error:', error);
    showError(dropdown, 'Failed to load suggestions');
  }
}

/**
 * Display results in dropdown
 */
function displayResults(dropdown, results, input) {
  dropdown.innerHTML = '';
  
  if (results.length === 0) {
    dropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: #6b7280;">No addresses found</div>';
    showDropdown(dropdown);
    return;
  }
  
  results.forEach((result, index) => {
    const item = document.createElement('div');
    item.className = 'checkout-autocomplete-item';
    item.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.15s;
    `;
    
    const mainText = result.address || result.fullText || 'Unknown Address';
    const subParts = [result.city, result.state, result.zip, result.country].filter(Boolean);
    const subText = subParts.join(', ');
    
    item.innerHTML = `
      <div style="font-size: 14px; font-weight: 500; color: #111827; margin-bottom: 4px;">
        ${escapeHtml(mainText)}
      </div>
      ${subText ? `<div style="font-size: 12px; color: #6b7280;">${escapeHtml(subText)}</div>` : ''}
    `;
    
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f3f4f6';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
    
    item.addEventListener('click', () => {
      selectAddress(input, result);
      hideDropdown(dropdown);
    });
    
    dropdown.appendChild(item);
  });
  
  showDropdown(dropdown);
}

/**
 * Select an address and fill form fields
 */
function selectAddress(input, address) {
  console.log('[Checkout Address Autocomplete] Selected:', address);
  
  // Fill address1 field
  input.value = address.address || address.fullText || '';
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Find and fill other fields
  const form = input.closest('form') || document;
  
  fillCheckoutField(form, 'city', address.city);
  fillCheckoutField(form, 'province', address.state);
  fillCheckoutField(form, 'zip', address.zip);
  fillCheckoutField(form, 'country', address.country, true); // true = handle country code
}

/**
 * Fill a checkout form field
 */
function fillCheckoutField(form, fieldName, value, isCountry = false) {
  if (!value) return;
  
  const selectors = [
    `input[name="${fieldName}"]`,
    `input[name="checkout[shipping_address][${fieldName}]"]`,
    `input[id*="${fieldName}"]`,
    `select[name="${fieldName}"]`,
    `select[name="checkout[shipping_address][${fieldName}]"]`,
    `select[id*="${fieldName}"]`
  ];
  
  for (const selector of selectors) {
    const field = form.querySelector(selector);
    if (field) {
      if (field.tagName === 'SELECT' && isCountry) {
        // Handle country select with 2-character codes
        setCountrySelect(field, value);
      } else {
        field.value = value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
      console.log(`[Checkout Address Autocomplete] Filled ${fieldName}:`, value);
      return;
    }
  }
}

/**
 * Set country select field
 * Handles both 2-character codes (US) and full names (United States)
 */
function setCountrySelect(select, countryCode) {
  const code = countryCode.toUpperCase();
  
  // Try to find by value (2-char code like "US")
  let option = Array.from(select.options).find(opt => opt.value === code);
  
  // Try to find by text
  if (!option) {
    option = Array.from(select.options).find(opt => 
      opt.text.toUpperCase().includes(code) || 
      opt.value.toUpperCase().includes(code)
    );
  }
  
  if (option) {
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`[Checkout Address Autocomplete] Set country to: ${option.value} (${option.text})`);
  } else {
    console.warn(`[Checkout Address Autocomplete] Country not found in select: ${code}`);
  }
}

/**
 * Update selection in dropdown
 */
function updateSelection(items, index) {
  items.forEach((item, i) => {
    if (i === index) {
      item.style.backgroundColor = '#f3f4f6';
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.style.backgroundColor = 'transparent';
    }
  });
}

/**
 * Show/hide dropdown
 */
function showDropdown(dropdown) {
  dropdown.style.display = 'block';
}

function hideDropdown(dropdown) {
  dropdown.style.display = 'none';
}

/**
 * Show loading state
 */
function showLoading(dropdown) {
  dropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: #6b7280;">Loading...</div>';
  dropdown.style.display = 'block';
}

/**
 * Show error
 */
function showError(dropdown, message) {
  dropdown.innerHTML = `<div style="padding: 16px; text-align: center; color: #dc2626;">${message}</div>`;
  dropdown.style.display = 'block';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

