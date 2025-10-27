import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * App Proxy Route: Address Search
 * 
 * Accessible via: https://yourstore.myshopify.com/apps/address-autocomplete/search
 * Proxied from: Your app URL
 * 
 * This allows the checkout extension to make same-origin requests!
 */

// CORS headers for checkout extensions
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Authenticate the app proxy request
  await authenticate.public.appProxy(request);
  
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const shop = url.searchParams.get("shop");
  const context = url.searchParams.get("context") || "checkout";

  console.log("[App Proxy] Address search request:", { query, shop, context });

  if (!query || !shop) {
    return json(
      { results: [], error: "Missing query or shop parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Get settings for this shop
    const settings = await prisma.swiftcompleteSettings.findUnique({
      where: { shop },
    });

    if (!settings || !settings.enabled) {
      return json(
        { results: [], error: "Service not enabled" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check context-specific settings
    if (context === "checkout" && !settings.enabledCheckout) {
      return json(
        { results: [], error: "Service not enabled for checkout" },
        { status: 403, headers: corsHeaders }
      );
    }

    if (context === "profile" && !settings.enabledProfile) {
      return json(
        { results: [], error: "Service not enabled for profile" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Call Swiftcomplete API
    const swiftcompleteUrl = `https://api.swiftcomplete.com/v1/autocomplete?key=${settings.apiKey}&query=${encodeURIComponent(query)}`;
    
    console.log("[App Proxy] Calling Swiftcomplete API");
    
    const response = await fetch(swiftcompleteUrl);

    if (!response.ok) {
      throw new Error(`Swiftcomplete API error: ${response.status}`);
    }

    const data = await response.json();

    // Track usage
    await prisma.swiftcompleteSettings.update({
      where: { shop },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    console.log("[App Proxy] Search successful, results:", data.results?.length || 0);

    return json(
      {
        results: data.results || [],
        success: true,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[App Proxy] Error:", error);
    return json(
      {
        results: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS for CORS
export async function options() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

