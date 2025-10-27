import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  DataTable,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Lấy app URL từ environment
  const appUrl = process.env.APP_URL || "https://wishlist-app.vercel.app";

  // Lấy Shop GID từ Admin API
  const shopIdRes = await admin.graphql(`#graphql
    query { shop { id } }
  `);
  const shopIdJson = await shopIdRes.json();
  const shopGid = shopIdJson.data?.shop?.id;
  if (!shopGid) {
    console.error("Unable to resolve shop GID", shopIdJson);
    return { success: false, error: "Unable to resolve shop GID" };
  }

  // Lưu vào shop metafield
  const response = await admin.graphql(
    `#graphql
      mutation UpdateShopMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            ownerId: shopGid,
            namespace: "custom",
            key: "app_url",
            value: appUrl,
            type: "single_line_text_field",
          },
        ],
      },
    },
  );

  const responseJson = await response.json();
  // console.log("Metafield response:", responseJson);

  // Check GraphQL errors
  if (responseJson.data.errors) {
    console.error("GraphQL error:", responseJson.data.errors);
    return { success: false, error: responseJson.data.errors };
  }

  // Check user errors from mutation
  if (responseJson.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("Metafield user errors:", responseJson.data.metafieldsSet.userErrors);
    return { success: false, error: responseJson.data.metafieldsSet.userErrors };
  }

  // Check if metafield was created
  const metafields = responseJson.data?.metafieldsSet?.metafields;
  if (!metafields || metafields.length === 0) {
    console.error("Failed to create metafield");
    return { success: false, error: "Failed to create metafield" };
  }

  console.log("✅ App URL saved to metafield:", appUrl);

  // Fetch wishlist items for this shop
  const wishlists = await prisma.wishlist.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { productId: true, customerId: true, createdAt: true },
  });

  return { success: true, appUrl, wishlists };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="Swift Address Autocomplete" />
      <BlockStack gap="500">
        <Layout>
          {/* Hero Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h1" variant="headingLg">
                    Welcome to Swift Address Autocomplete 🚀
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Intelligent address autocomplete for your Shopify checkout, powered by Swiftcomplete API
                  </Text>
                </BlockStack>

                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      ✨ What This App Does
                    </Text>
                    <List>
                      <List.Item>
                        <strong>Real-time Address Suggestions:</strong> As customers type their address during checkout, they see instant autocomplete suggestions
                      </List.Item>
                      <List.Item>
                        <strong>Checkout UI Extension:</strong> Seamlessly integrated into the native Shopify checkout experience
                      </List.Item>
                      <List.Item>
                        <strong>Secure Backend Proxy:</strong> Your Swiftcomplete API key is never exposed to the frontend
                      </List.Item>
                      <List.Item>
                        <strong>Usage Tracking:</strong> Every API call is tracked for billing purposes ($0.03 per lookup)
                      </List.Item>
                    </List>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Screenshot Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  📸 How It Looks in Checkout
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  The address autocomplete appears directly in your checkout page:
                </Text>
                <Box
                  borderRadius="200"
                  borderWidth="025"
                  borderColor="border"
                  padding="0"
                >
                  <img
                    src="/checkout-screenshot.png"
                    alt="Address Autocomplete in Checkout"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      borderRadius: "8px",
                    }}
                  />
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* How to Use Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  🎯 How to Use This App
                </Text>
                <BlockStack gap="300">
                  <Box>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Step 1: Configure Your API Key
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Go to{" "}
                        <Link url="/app/address-autocomplete" removeUnderline>
                          Address Autocomplete Settings
                        </Link>{" "}
                        and enter your Swiftcomplete API key. Toggle "Enable Checkout pages" ON and save.
                      </Text>
                    </BlockStack>
                  </Box>

                  <Box>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Step 2: Preview the Extension
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Run <code>npm run dev</code> in your terminal. The CLI will open the Dev Console where you can preview the checkout extension.
                      </Text>
                    </BlockStack>
                  </Box>

                  <Box>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Step 3: Test the Autocomplete
                      </Text>
                      <Text as="p" variant="bodyMd">
                        In the checkout preview, type an address (e.g., "123 Main"). After 300ms, you'll see autocomplete suggestions appear. Select one to populate the field.
                      </Text>
                    </BlockStack>
                  </Box>

                  <Box>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Step 4: Deploy (Optional)
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Run <code>npm run deploy</code> to deploy the extension. Then enable it in Settings → Checkout → Customize.
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Technical Details */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    🧰 Tech Stack
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Backend
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Extension
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/checkout-ui-extensions"
                        target="_blank"
                        removeUnderline
                      >
                        UI Extensions
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://swiftcomplete.com"
                        target="_blank"
                        removeUnderline
                      >
                        Swiftcomplete
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    📚 Documentation
                  </Text>
                  <List>
                    <List.Item>
                      <Link
                        url="https://github.com/yourusername/swift-address-autocomplete/blob/main/README.md"
                        target="_blank"
                        removeUnderline
                      >
                        Setup Guide
                      </Link>
                    </List.Item>
                    <List.Item>
                      <Link
                        url="https://github.com/yourusername/swift-address-autocomplete/blob/main/TESTING_GUIDE_CHECKOUT.md"
                        target="_blank"
                        removeUnderline
                      >
                        Testing Guide
                      </Link>
                    </List.Item>
                    <List.Item>
                      <Link
                        url="/app/address-autocomplete"
                        removeUnderline
                      >
                        Configure Settings
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    🎓 Key Features Demonstrated
                  </Text>
                  <List>
                    <List.Item>Checkout UI Extension target</List.Item>
                    <List.Item>React component rendering</List.Item>
                    <List.Item>API integration (Swiftcomplete)</List.Item>
                    <List.Item>Reactive UI with debouncing</List.Item>
                    <List.Item>Keyboard navigation support</List.Item>
                    <List.Item>Automatic URL injection</List.Item>
                    <List.Item>Settings validation</List.Item>
                    <List.Item>Usage tracking</List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
