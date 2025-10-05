import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { Page, Card, FormLayout, TextField, Button, Banner, BlockStack } from "@shopify/polaris";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    setIsSubmitting(true);
  };

  return (
    <AppProvider embedded={false}>
      <PolarisAppProvider i18n={enTranslations}>
        <Page>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px'
          }}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
              <BlockStack gap="500">
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                    AI IncredibleBulk
                  </h1>
                  <p style={{ color: '#6b7280' }}>Sign in to your Shopify store</p>
                </div>

                <Card>
                  <Form method="post" onSubmit={handleSubmit}>
                    <FormLayout>
                      {errors.shop && (
                        <Banner tone="critical">
                          {errors.shop}
                        </Banner>
                      )}

                      <TextField
                        label="Shop domain"
                        type="text"
                        name="shop"
                        value={shop}
                        onChange={setShop}
                        placeholder="example.myshopify.com"
                        autoComplete="on"
                        helpText="Enter your Shopify store domain"
                        error={errors.shop}
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
                    </FormLayout>
                  </Form>
                </Card>

                <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                  <p>Don't have a Shopify store?{' '}
                    <a
                      href="https://www.shopify.com/free-trial"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2c6ecb', textDecoration: 'none' }}
                    >
                      Start free trial
                    </a>
                  </p>
                </div>
              </BlockStack>
            </div>
          </div>
        </Page>
      </PolarisAppProvider>
    </AppProvider>
  );
}
