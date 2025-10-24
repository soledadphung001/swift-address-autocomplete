/**
 * Address Autocomplete Extension
 * Detects and enhances address forms including dynamic popups
 * Works with Swiftcomplete API
 */

(function() {
  'use strict';

  // Configuration - will be set from backend
  let config = {
    apiEndpoint: '/apps/address-autocomplete/search',
    enabled: true,
    minCharacters: 3,
    debounceDelay: 300
  };

  // Store active autocomplete instances
  const autocompleteInstances = new Map();
  let debounceTimer = null;

  /**
   * Main initialization function
   */
  function init() {
    console.log('[Address Autocomplete] Initializing...');
    
    // Watch for existing address forms
    enhanceExistingForms();
    
    // Watch for dynamically added forms (popups, modals)
    observeDOMForNewForms();
    
    // Listen for page changes (SPA navigation)
    setupNavigationListeners();
  }

  /**
   * Find and enhance all existing address forms on the page
   */
  function enhanceExistingForms() {
    const addressInputs = findAddressInputs();
    console.log(`[Address Autocomplete] Found ${addressInputs.length} address inputs`);
    
    addressInputs.forEach(input => {
      if (!autocompleteInstances.has(input)) {
        attachAutocomplete(input);
      }
    });
  }

  /**
   * Watch for new forms being added to the DOM (like popups)
   * This is KEY for handling the "Add Address" popup
   */
  function observeDOMForNewForms() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        // Check if new nodes were added
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            // Skip text nodes
            if (node.nodeType !== 1) return;
            
            // Check if it's a modal/popup or contains form fields
            if (node.matches && (
              node.matches('dialog') || 
              node.matches('[role="dialog"]') ||
              node.matches('.modal') ||
              node.matches('form') ||
              node.querySelector('input[name*="address"]')
            )) {
              shouldCheck = true;
            }
          });
        }
      });
      
      if (shouldCheck) {
        // Small delay to ensure form is fully rendered
        setTimeout(enhanceExistingForms, 100);
      }
    });

    // Start observing the entire document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Address Autocomplete] DOM observer activated');
  }

  /**
   * Find all address input fields
   * Looks for common patterns in Shopify customer account forms
   */
  function findAddressInputs() {
    const selectors = [
      'input[name*="address"][name*="address1"]',
      'input[name*="address"][name*="street"]',
      'input[id*="address1"]',
      'input[id*="address_address1"]',
      'input[placeholder*="Address"]',
      'input[autocomplete="address-line1"]',
      'input[autocomplete="street-address"]'
    ];
    
    const inputs = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(input => {
        if (!inputs.includes(input)) {
          inputs.push(input);
        }
      });
    });
    
    return inputs;
  }

  /**
   * Attach autocomplete functionality to an input field
   */
  function attachAutocomplete(input) {
    console.log('[Address Autocomplete] Attaching to:', input);
    
    // Mark as enhanced
    input.dataset.autocompleteEnhanced = 'true';
    
    // Create dropdown container
    const dropdown = createDropdown(input);
    
    // Store instance
    autocompleteInstances.set(input, { dropdown, results: [] });
    
    // Attach event listeners
    input.addEventListener('input', handleInput);
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('keydown', handleKeyDown);
    
    console.log('[Address Autocomplete] Attached successfully');
  }

  /**
   * Create autocomplete dropdown element
   */
  function createDropdown(input) {
    const dropdown = document.createElement('div');
    dropdown.className = 'address-autocomplete-dropdown';
    dropdown.style.display = 'none';
    
    // Position relative to input
    const inputRect = input.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '10000';
    
    // Insert after input
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(dropdown);
    
    return dropdown;
  }

  /**
   * Handle input changes
   */
  function handleInput(event) {
    const input = event.target;
    
    // Skip if we're programmatically selecting an address (prevents loop)
    if (input.dataset.isSelecting === 'true') {
      return;
    }
    
    const query = input.value.trim();
    
    if (query.length < config.minCharacters) {
      hideDropdown(input);
      return;
    }
    
    // Debounce API calls
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchAddress(input, query);
    }, config.debounceDelay);
  }

  /**
   * Handle input focus
   */
  function handleFocus(event) {
    const input = event.target;
    const instance = autocompleteInstances.get(input);
    
    if (instance && instance.results.length > 0) {
      showDropdown(input);
    }
  }

  /**
   * Handle input blur
   */
  function handleBlur(event) {
    const input = event.target;
    
    // Delay to allow click on dropdown
    setTimeout(() => {
      hideDropdown(input);
    }, 200);
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeyDown(event) {
    const input = event.target;
    const instance = autocompleteInstances.get(input);
    
    if (!instance || !instance.dropdown.style.display === 'none') return;
    
    const items = instance.dropdown.querySelectorAll('.autocomplete-item');
    const activeItem = instance.dropdown.querySelector('.autocomplete-item.active');
    let activeIndex = Array.from(items).indexOf(activeItem);
    
    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        setActiveItem(items, activeIndex);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
        setActiveItem(items, activeIndex);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (activeItem) {
          activeItem.click();
        }
        break;
        
      case 'Escape':
        hideDropdown(input);
        break;
    }
  }

  /**
   * Set active item in dropdown
   */
  function setActiveItem(items, index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Search for addresses using Swiftcomplete API (via backend proxy)
   */
  async function searchAddress(input, query) {
    const instance = autocompleteInstances.get(input);
    if (!instance) return;
    
    try {
      // Show loading state
      showLoading(instance.dropdown);
      
      // Call backend API (which proxies to Swiftcomplete)
      const response = await fetch(`${config.apiEndpoint}&q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      // Store results
      instance.results = data.results || [];
      
      // Display results
      displayResults(input, instance.results);
      
    } catch (error) {
      console.error('[Address Autocomplete] Error:', error);
      showError(instance.dropdown, 'Failed to load address suggestions');
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Display autocomplete results
   */
  function displayResults(input, results) {
    const instance = autocompleteInstances.get(input);
    if (!instance) return;
    
    const dropdown = instance.dropdown;
    dropdown.innerHTML = '';
    
    if (results.length === 0) {
      dropdown.innerHTML = '<div class="autocomplete-no-results">No addresses found</div>';
      showDropdown(input);
      return;
    }
    
    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      if (index === 0) item.classList.add('active');
      
      // Build display text
      const mainText = result.address || result.fullText || 'Unknown Address';
      let subText = '';
      
      // Build location string from available parts
      const locationParts = [
        result.city,
        result.state,
        result.zip,
        result.country
      ].filter(part => part && part.trim() !== '');
      
      if (locationParts.length > 0) {
        subText = locationParts.join(', ');
      }
      
      item.innerHTML = `
        <div class="autocomplete-item-main">${escapeHtml(mainText)}</div>
        ${subText ? `<div class="autocomplete-item-sub">${escapeHtml(subText)}</div>` : ''}
      `;
      
      item.addEventListener('click', () => {
        selectAddress(input, result);
      });
      
      dropdown.appendChild(item);
    });
    
    showDropdown(input);
  }

  /**
   * Select an address and populate form fields
   */
  function selectAddress(input, address) {
    console.log('[Address Autocomplete] Selected address:', address);
    
    // Mark that we're programmatically setting the value to prevent search loop
    input.dataset.isSelecting = 'true';
    
    // Fill the main address input - use fullText if address is empty
    const addressValue = address.address || address.fullText || '';
    input.value = addressValue;
    
    // Try to fill other fields in the form
    const form = input.closest('form');
    if (form) {
      fillFormFields(form, address);
    }
    
    // Hide dropdown
    hideDropdown(input);
    
    // Trigger change event (for form validation)
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Remove the flag after a short delay
    setTimeout(() => {
      delete input.dataset.isSelecting;
    }, 100);
  }

  /**
   * Map ISO 2-letter country codes to full country names
   */
  const countryCodeToName = {
    'AU': 'Australia', 'CA': 'Canada', 'CN': 'China', 'DE': 'Germany',
    'FR': 'France', 'GB': 'United Kingdom', 'IN': 'India', 'IT': 'Italy',
    'JP': 'Japan', 'MX': 'Mexico', 'NL': 'Netherlands', 'NZ': 'New Zealand',
    'SG': 'Singapore', 'ES': 'Spain', 'SE': 'Sweden', 'CH': 'Switzerland',
    'US': 'United States', 'AE': 'United Arab Emirates', 'BE': 'Belgium',
    'BR': 'Brazil', 'DK': 'Denmark', 'FI': 'Finland', 'HK': 'Hong Kong',
    'IE': 'Ireland', 'NO': 'Norway', 'PL': 'Poland', 'PT': 'Portugal',
    'RU': 'Russia', 'SA': 'Saudi Arabia', 'ZA': 'South Africa', 'KR': 'South Korea',
    'TH': 'Thailand', 'TR': 'Turkey', 'AT': 'Austria', 'CZ': 'Czech Republic',
    'GR': 'Greece', 'HU': 'Hungary', 'IL': 'Israel', 'MY': 'Malaysia',
    'PH': 'Philippines', 'RO': 'Romania', 'AR': 'Argentina', 'CL': 'Chile',
    'CO': 'Colombia', 'EG': 'Egypt', 'ID': 'Indonesia', 'PK': 'Pakistan',
    'PE': 'Peru', 'UA': 'Ukraine', 'VN': 'Vietnam'
  };

  /**
   * Fill form fields with address data
   */
  function fillFormFields(form, address) {
    const fieldMappings = {
      city: ['city', 'address_city', 'locality', 'town'],
      state: ['province', 'state', 'region', 'address_province', 'address_state'],
      zip: ['zip', 'postal', 'postcode', 'address_zip', 'address_postal'],
      country: ['country', 'address_country', 'country_code']
    };
    
    console.log('[Address Autocomplete] Filling form with:', address);
    
    Object.keys(fieldMappings).forEach(key => {
      if (!address[key] || !address[key].trim()) {
        form.querySelector('input[name="address['+key+']"]') && (form.querySelector('input[name="address['+key+']"]').value = '');
        return;
      } 
      
      let fieldFilled = false;
      
      fieldMappings[key].forEach(fieldName => {
        if (fieldFilled) return; // Already filled this field type
        
        // Try by name
        let field = form.querySelector(`input[name*="${fieldName}"]`) || 
                   form.querySelector(`select[name*="${fieldName}"]`);
        
        // Try by id
        if (!field) {
          field = form.querySelector(`input[id*="${fieldName}"]`) ||
                 form.querySelector(`select[id*="${fieldName}"]`);
        }
        
        if (field) {
          let valueToSet = address[key];
          
          // Special handling for country fields
          if (key === 'country' && field.tagName === 'SELECT') {
            // Convert 2-letter code to full country name for select fields
            const countryCode = address[key].toUpperCase();
            const countryName = countryCodeToName[countryCode];
            
            if (countryName) {
              // Try to find option with this value
              const optionByName = Array.from(field.options).find(
                opt => opt.value === countryName || opt.text === countryName
              );
              
              // Try to find option by 2-letter code
              const optionByCode = Array.from(field.options).find(
                opt => opt.value === countryCode || opt.text === countryCode
              );
              
              if (optionByName) {
                valueToSet = optionByName.value;
              } else if (optionByCode) {
                valueToSet = optionByCode.value;
              } else {
                console.log(`[Address Autocomplete] Country not found in select: ${countryCode} / ${countryName}`);
                return; // Skip this field
              }
            }
          }
          
          field.value = valueToSet;
          // Only dispatch change event (for form validation), not input (to avoid loops)
          field.dispatchEvent(new Event('change', { bubbles: true }));
          fieldFilled = true;
          console.log(`[Address Autocomplete] Filled ${key} field:`, field.name || field.id, '=', valueToSet);
        }
      });
      
      if (!fieldFilled) {
        console.log(`[Address Autocomplete] Could not find field for ${key}:`, address[key]);
      }
    });
  }

  /**
   * Show dropdown
   */
  function showDropdown(input) {
    const instance = autocompleteInstances.get(input);
    if (!instance) return;
    
    instance.dropdown.style.display = 'block';
  }

  /**
   * Hide dropdown
   */
  function hideDropdown(input) {
    const instance = autocompleteInstances.get(input);
    if (!instance) return;
    
    instance.dropdown.style.display = 'none';
  }

  /**
   * Show loading state
   */
  function showLoading(dropdown) {
    dropdown.innerHTML = '<div class="autocomplete-loading">Loading...</div>';
    dropdown.style.display = 'block';
  }

  /**
   * Show error message
   */
  function showError(dropdown, message) {
    dropdown.innerHTML = `<div class="autocomplete-error">${message}</div>`;
    dropdown.style.display = 'block';
  }

  /**
   * Setup navigation listeners for SPA
   */
  function setupNavigationListeners() {
    // Listen for page navigation events
    window.addEventListener('popstate', () => {
      setTimeout(enhanceExistingForms, 100);
    });
    
    // Listen for Shopify section rendering
    document.addEventListener('shopify:section:load', () => {
      setTimeout(enhanceExistingForms, 100);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.AddressAutocomplete = {
    config,
    enhanceExistingForms,
    autocompleteInstances
  };

})();

