import { json, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

/**
 * Public API Route: Checkout Configuration
 * Returns configuration for checkout address autocomplete
 * Used by Web Pixels to get app URL and settings dynamically
 */

// CORS headers for public access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json(
      { error: "Shop parameter required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Get settings for this shop
    const settings = await prisma.swiftcompleteSettings.findUnique({
      where: { shop },
    });

    // Get app URL from request origin or use environment variable
    const appUrl = new URL(request.url).origin;

    console.log("appUrl", appUrl);

    // Return configuration
    return json(
      {
        success: true,
        config: {
          enabled: settings?.enabled || false,
          enabledCheckout: settings?.enabledCheckout || false,
          apiEndpoint: `${appUrl}/api/address-autocomplete/search`,
          shop: shop,
          minCharacters: 3,
          debounceDelay: 300,
          context: 'checkout'
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Checkout Config API] Error:", error);
    return json(
      { error: "Failed to fetch configuration", success: false },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function options() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

