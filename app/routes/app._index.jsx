import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Page, Layout, Card, Text, BlockStack, List, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import ChatInterface from "../components/ChatInterface.jsx";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
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
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
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
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  return (
    <Page title="AI IncredibleBulk">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingLg" as="h2">AI-Powered Spreadsheet Management 🚀</Text>
                <Text variant="bodyMd" as="p">
                  Manage your spreadsheets using natural language commands. Connect to Google Sheets 
                  or Microsoft Excel and let AI handle the complex operations for you.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text variant="headingLg" as="h2">Chat Interface</Text>
                <Text variant="bodyMd" as="p">
                  Start a conversation with AI to manage your spreadsheets. Try commands like:
                </Text>
                <List type="bullet">
                  <List.Item>"Sort my inventory by price descending"</List.Item>
                  <List.Item>"Filter products with stock less than 10"</List.Item>
                  <List.Item>"Add a formula to calculate total revenue"</List.Item>
                  <List.Item>"Create a chart showing sales trends"</List.Item>
                </List>
                
                <div style={{ marginTop: "20px" }}>
                  <ChatInterface sessionId={sessionId} />
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">Features</Text>
                <List type="bullet">
                  <List.Item>Natural Language Processing</List.Item>
                  <List.Item>Google Sheets Integration</List.Item>
                  <List.Item>Microsoft Excel Support</List.Item>
                  <List.Item>AI-Powered Operations</List.Item>
                  <List.Item>Real-time Collaboration</List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">Getting Started</Text>
                <List type="bullet">
                  <List.Item>Connect your Google Sheets or Microsoft Excel account</List.Item>
                  <List.Item>Start chatting with AI about your spreadsheet needs</List.Item>
                  <List.Item>Review and execute AI-generated operations</List.Item>
                  <List.Item>Monitor your spreadsheet changes in real-time</List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
