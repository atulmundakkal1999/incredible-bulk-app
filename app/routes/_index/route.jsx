import { redirect, Form, useLoaderData } from "react-router";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { Page, Card, TextField, Button, BlockStack, Text, List } from "@shopify/polaris";
import { login } from "../../shopify.server";
import { useState } from "react";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();
  const [shop, setShop] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <PolarisAppProvider i18n={enTranslations}>
      <div className={styles.index}>
        <div className={styles.content}>
          <BlockStack gap="600">
            <div style={{ textAlign: 'center' }}>
              <h1 className={styles.heading}>AI IncredibleBulk</h1>
              <p className={styles.text}>
                Automate spreadsheet management using natural language. 
                Connect to Google Sheets or Microsoft Excel and let AI handle complex operations.
              </p>
            </div>

            {showForm && (
              <Card>
                <Form
                  className={styles.form}
                  method="post"
                  action="/auth/login"
                  onSubmit={() => setIsSubmitting(true)}
                >
                  <BlockStack gap="400">
                    <TextField
                      label="Shop domain"
                      type="text"
                      name="shop"
                      value={shop}
                      onChange={setShop}
                      placeholder="my-shop-domain.myshopify.com"
                      autoComplete="on"
                      helpText="Enter your Shopify store domain"
                    />
                    <Button
                      submit
                      primary
                      fullWidth
                      loading={isSubmitting}
                      disabled={!shop.trim()}
                    >
                      Log in
                    </Button>
                  </BlockStack>
                </Form>
              </Card>
            )}

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Key Features</Text>
                <List type="bullet">
                  <List.Item>
                    <strong>Natural Language Processing</strong> - Use simple commands like "Sort inventory by price" to manage your data
                  </List.Item>
                  <List.Item>
                    <strong>Real-Time Integration</strong> - Connect seamlessly with Google Sheets and Microsoft Excel Online
                  </List.Item>
                  <List.Item>
                    <strong>AI-Powered Automation</strong> - Let AI handle complex spreadsheet operations without coding
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </div>
      </div>
    </PolarisAppProvider>
  );
}
