import {
  Box,
  Card,
  Page,
  BlockStack,
  TextField,
  Button,
  Banner,
  InlineStack,
  Text,
  Checkbox,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { ActionFunctionArgs, json, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

/**
 * Loader: Fetch current settings
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await prisma.swiftcompleteSettings.findUnique({
    where: { shop },
  });

  // Get usage statistics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usageStats = await prisma.addressLookup.aggregate({
    where: {
      shop,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: true,
    _sum: {
      chargeAmount: true,
    },
  });

  return json({
    settings: settings || {
      apiKey: "",
      enabled: true,
      enabledCheckout: true,
      enabledProfile: true,
      chargePerLookup: 0.03,
      maxMonthlyCharge: 100.0,
    },
    usageStats: {
      lookups: usageStats._count || 0,
      totalCost: usageStats._sum.chargeAmount || 0,
    },
    shop,
  });
}

/**
 * Action: Save settings
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  
  const apiKey = formData.get("apiKey") as string;
  const enabled = formData.get("enabled") === "true";
  const enabledCheckout = formData.get("enabledCheckout") === "true";
  const enabledProfile = formData.get("enabledProfile") === "true";
  const chargePerLookup = parseFloat(formData.get("chargePerLookup") as string) || 0.03;
  const maxMonthlyCharge = parseFloat(formData.get("maxMonthlyCharge") as string) || 100.0;

  if (!apiKey || apiKey.trim().length === 0) {
    return json({ 
      success: false, 
      message: "API Key is required" 
    }, { status: 400 });
  }

  await prisma.swiftcompleteSettings.upsert({
    where: { shop },
    update: {
      apiKey,
      enabled,
      enabledCheckout,
      enabledProfile,
      chargePerLookup,
      maxMonthlyCharge,
    },
    create: {
      shop,
      apiKey,
      enabled,
      enabledCheckout,
      enabledProfile,
      chargePerLookup,
      maxMonthlyCharge,
    },
  });

  return json({ 
    success: true, 
    message: "Settings saved successfully" 
  });
}

/**
 * Settings Page Component
 */
export default function AddressAutocompleteSettings() {
  const { settings, usageStats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    apiKey: settings?.apiKey ?? "",
    enabled: settings?.enabled ?? true,
    enabledCheckout: settings?.enabledCheckout ?? true,
    enabledProfile: settings?.enabledProfile ?? true,
    chargePerLookup: settings?.chargePerLookup?.toString() ?? "0.03",
    maxMonthlyCharge: settings?.maxMonthlyCharge?.toString() ?? "100.00",
  });

  return (
    <Page>
      <TitleBar title="Address Autocomplete Settings" />
      
      <BlockStack gap="500">
        {/* Success/Error Banner */}
        {actionData?.message && (
          <Banner
            tone={actionData.success ? "success" : "critical"}
            onDismiss={() => {}}
          >
            {actionData.message}
          </Banner>
        )}

        {/* Usage Statistics */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Usage Statistics (Last 30 Days)
            </Text>
            <InlineStack gap="400">
              <Box>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {usageStats.lookups}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Address Lookups
                </Text>
              </Box>
              <Box>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  ${usageStats.totalCost.toFixed(2)}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Cost
                </Text>
              </Box>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Settings Form */}
        <Card>
          <Form method="post">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Swiftcomplete API Configuration
              </Text>

              <TextField
                label="Swiftcomplete API Key"
                name="apiKey"
                type="password"
                value={formState.apiKey}
                onChange={(value) => setFormState({ ...formState, apiKey: value })}
                autoComplete="off"
                helpText="Get your API key from Swiftcomplete dashboard"
              />

              <Checkbox
                label="Enable address autocomplete"
                checked={formState.enabled}
                onChange={(value) => setFormState({ ...formState, enabled: value })}
                helpText="Master switch for address autocomplete functionality"
              />

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Enable For:
                </Text>
                
                <Checkbox
                  label="Checkout pages"
                  checked={formState.enabledCheckout}
                  onChange={(value) => setFormState({ ...formState, enabledCheckout: value })}
                  disabled={!formState.enabled}
                />

                <Checkbox
                  label="Profile & account pages"
                  checked={formState.enabledProfile}
                  onChange={(value) => setFormState({ ...formState, enabledProfile: value })}
                  disabled={!formState.enabled}
                />
              </BlockStack>

              <TextField
                label="Charge per lookup"
                name="chargePerLookup"
                type="number"
                value={formState.chargePerLookup.toString()}
                onChange={(value) => setFormState({ ...formState, chargePerLookup: value })}
                prefix="$"
                step={0.01}
                min={0}
                helpText="Amount to charge merchants per address lookup (for future billing)"
              />

              <TextField
                label="Maximum monthly charge"
                name="maxMonthlyCharge"
                type="number"
                value={formState.maxMonthlyCharge.toString()}
                onChange={(value) => setFormState({ ...formState, maxMonthlyCharge: value })}
                prefix="$"
                step={1}
                min={0}
                helpText="Maximum amount to charge per month (capped amount)"
              />

              {/* Hidden fields for checkboxes */}
              <input type="hidden" name="enabled" value={formState.enabled.toString()} />
              <input type="hidden" name="enabledCheckout" value={formState.enabledCheckout.toString()} />
              <input type="hidden" name="enabledProfile" value={formState.enabledProfile.toString()} />

              <Button submit loading={isSubmitting}>
                Save Settings
              </Button>
            </BlockStack>
          </Form>
        </Card>

        {/* Installation Instructions */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Installation Instructions
            </Text>
            
            <Text as="p" variant="bodyMd">
              <strong>For Profile Pages (Theme App Extension):</strong>
            </Text>
            
            <Box paddingInlineStart="400">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  1. Go to your Online Store → Themes → Customize
                </Text>
                <Text as="p" variant="bodyMd">
                  2. Navigate to Theme Settings → App Embeds
                </Text>
                <Text as="p" variant="bodyMd">
                  3. Find "Address Autocomplete" and enable it
                </Text>
                <Text as="p" variant="bodyMd">
                  4. Save your theme
                </Text>
              </BlockStack>
            </Box>

            <Banner tone="info">
              The address autocomplete will automatically work on customer profile pages,
              including the "Add address" popup!
            </Banner>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

