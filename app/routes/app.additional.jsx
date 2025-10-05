import { Page, Layout, Card, Text, BlockStack, List, Link } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AdditionalPage() {
  return (
    <Page title="Additional page">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">Multiple pages</Text>
              <Text variant="bodyMd" as="p">
                The app template comes with an additional page which demonstrates how
                to create multiple pages within app navigation using{" "}
                <Link url="https://shopify.dev/docs/apps/tools/app-bridge" external>
                  App Bridge
                </Link>
                .
              </Text>
              <Text variant="bodyMd" as="p">
                To create your own page and have it show up in the app navigation, add
                a page inside <code>app/routes</code>, and a link to it in the{" "}
                <code>&lt;ui-nav-menu&gt;</code> component found in{" "}
                <code>app/routes/app.jsx</code>.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">Resources</Text>
              <List type="bullet">
                <List.Item>
                  <Link
                    url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
                    external
                  >
                    App nav best practices
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
