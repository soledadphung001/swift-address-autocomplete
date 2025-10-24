import { json, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

/**
 * API Route: Address Autocomplete Search
 * Proxies requests to Swiftcomplete API
 * Tracks usage for billing purposes
 * PUBLIC ROUTE - accessible from storefront
 */

// Helper to add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ results: [], error: "Shop parameter required" }, { status: 400, headers: corsHeaders });
  }

  if (!query || query.trim().length < 3) {
    return json({ results: [], error: "Query too short" }, { status: 400, headers: corsHeaders });
  }

  try {
    // Get Swiftcomplete settings for this shop
    const settings = await prisma.swiftcompleteSettings.findUnique({
      where: { shop },
    });

    if (!settings || !settings.enabled) {
      return json({ results: [], error: "Service not enabled" }, { status: 403, headers: corsHeaders });
    }

    // Call Swiftcomplete API using their actual endpoint
    const params = new URLSearchParams({
      key: settings.apiKey,
      text: query.trim(),
      searchFor: 'address,road', // Search for addresses and roads
      maxResults: '5',
      // countries: 'us,ca', // Optional: restrict by country
    });
    
    const swiftcompleteUrl = `https://api.swiftcomplete.com/v1/swiftlookup/?${params}`;
    
    const response = await fetch(swiftcompleteUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    // console.log('response:', await response.json());

    if (!response.ok) {
      console.error('[Address Autocomplete API] Error:', response.status);
      throw new Error(`Swiftcomplete API error: ${response.status}`);
    }

    const data = await response.json();

    // Track usage for billing
    await prisma.addressLookup.create({
      data: {
        shop,
        query: query.trim(),
        resultCount: Array.isArray(data) ? data.length : 0,
        charged: false,
        chargeAmount: settings.chargePerLookup,
      },
    });

    // Transform Swiftcomplete response to our format
    const results = (Array.isArray(data) ? data : []).map((item: any) => {
      // Parse the container string for detailed address info
      // Format: "V1;Street|PostalCode|City|Country;lat;lng"
      // Example: "V1;Addison Ave|Niagara Falls|ON|L2J;43.128025;-79.091698"
      let street = item.primary?.text || '';
      let postalCode = '';
      let city = '';
      let region = '';
      
      if (item.container) {
        const parts = item.container.split('|');
        if (parts.length >= 2) {
          street = parts[0]?.split(';')[1] || street;
          
          // Handle different container formats
          if (parts.length === 4) {
            // Format: Street|City|Region|PostalCode
            city = parts[1] || '';
            region = parts[2] || '';
            postalCode = parts[3]?.split(';')[0] || '';
          } else if (parts.length === 3) {
            // Format: Street|PostalCode|City or Street|City|Country
            const secondPart = parts[1] || '';
            const thirdPart = parts[2]?.split(';')[0] || '';
            
            // Check if second part looks like postal code (contains numbers)
            if (/\d/.test(secondPart) && secondPart.length <= 10) {
              postalCode = secondPart;
              city = thirdPart;
            } else {
              city = secondPart;
              region = thirdPart;
            }
          }
        }
      }
      
      // Use secondary text as fallback for location info
      const secondaryText = item.secondary?.text || '';
      if (!city && secondaryText) {
        city = secondaryText;
      }
      
      return {
        address: street,
        city: city,
        state: region,
        zip: postalCode,
        country: item.countryCode || '',
        fullText: `${item.primary?.text || ''}, ${secondaryText}`.trim().replace(/,$/, ''),
      };
    });

    return json({ results, success: true }, { headers: corsHeaders });

  } catch (error) {
    console.error("[Address Autocomplete API] Error:", error);
    return json(
      { results: [], error: "Failed to fetch addresses" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// For testing without authentication
export async function action({ request }: LoaderFunctionArgs) {
  return loader({ request } as LoaderFunctionArgs);
}

