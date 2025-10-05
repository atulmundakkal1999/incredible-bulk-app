import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Page, Layout, Card, Button, InlineStack, SkeletonBodyText, BlockStack, Text, Checkbox, Badge } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Lazy load Handsontable
const HotTable = lazy(() => import("@handsontable/react").then(m => ({ default: m.HotTable })));

// Lazy load CSS
if (typeof window !== 'undefined') {
  import("handsontable/dist/handsontable.full.min.css");
}

// ----- Server side -----
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100');
  
  // Only fetch first batch for faster initial load
  const response = await admin.graphql(`
    #graphql
    query BulkEditorProducts($first: Int!) {
      products(first: $first) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          title
          status
          vendor
          variants(first: 1) {
            nodes { 
              id 
              price 
              sku 
              inventoryQuantity
            }
          }
        }
      }
    }
  `, { variables: { first: Math.min(limit, 250) } });
  
  const json = await response.json();
  const products = json?.data?.products?.nodes ?? [];
  
  console.log(`Loaded ${products.length} products (initial batch)`);
  return { products, hasMore: json?.data?.products?.pageInfo?.hasNextPage ?? false };
};

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const { edits } = await request.json();

    const productEdits = [];
    const variantEdits = [];
    for (const e of edits || []) {
      if (e.type === "product") productEdits.push(e);
      if (e.type === "variant") variantEdits.push(e);
    }

    // Batch product updates (title, status, vendor, category)
    for (const chunk of chunkArray(productEdits, 10)) {
      for (const p of chunk) {
        await admin.graphql(`
          #graphql
          mutation UpdateProduct($id: ID!, $input: ProductInput!) {
            productUpdate(id: $id, input: $input) { product { id } userErrors { field message } }
          }
        `, {
          variables: {
            id: p.id,
            input: {
              title: p.title,
              status: p.status,
              vendor: p.vendor,
              productCategory: p.category ? { productTaxonomyNodeId: p.category } : undefined,
            },
          },
        });
      }
    }

    // Batch variant updates (price, sku, inventory)
    if (variantEdits.length) {
      for (const chunk of chunkArray(variantEdits, 50)) {
        await admin.graphql(`
          #graphql
          mutation BulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              productVariants { id }
              userErrors { field message }
            }
          }
        `, {
          variables: {
            productId: chunk[0].productId,
            variants: chunk.map(v => ({ id: v.id, price: v.price, sku: v.sku })),
          },
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("bulk action error", error);
    return Response.json({ success: false, error: error?.message || "Server error" }, { status: 500 });
  }
};

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ----- Client side -----
const ALL_COLUMNS = [
  { key: "title", label: "Product title", type: "product" },
  { key: "status", label: "Status", type: "product" },
  { key: "category", label: "Product category", type: "product" },
  { key: "vendor", label: "Vendor", type: "product" },
  { key: "price", label: "Base price", type: "variant" },
  { key: "sku", label: "SKU", type: "variant" },
  { key: "inventoryQuantity", label: "Inventory", type: "variant" },
];

export default function BulkEditor() {
  const [products, setProducts] = useState([]);
  const [columns, setColumns] = useState(["title", "status", "category", "vendor", "price"]);
  const [changed, setChanged] = useState([]); // list of edits
  const [loading, setLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const hotRef = useRef(null);

  // Load initial data passed by loader via window.__RR_DATA? Use fetcher to call loader endpoint
  useEffect(() => {
    (async () => {
      setIsLoadingProducts(true);
      try {
        const res = await fetch(location.pathname + '?limit=100', { method: "GET" });
        const data = await res.json();
        setProducts(data?.products || []);
        console.log(`Loaded ${data?.products?.length || 0} products (initial batch)`);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    })();
  }, []);

  const data = useMemo(() => {
    const rows = [];
    for (const p of products) {
      const v = p.variants?.nodes?.[0];
      const row = {};
      for (const col of columns) {
        switch (col) {
          case "title": row[col] = p.title; break;
          case "status": row[col] = p.status; break;
          case "category": row[col] = p.productCategory?.productTaxonomyNode?.fullName || ""; break;
          case "vendor": row[col] = p.vendor || ""; break;
          case "price": row[col] = v?.price ?? ""; break;
          case "sku": row[col] = v?.sku ?? ""; break;
          case "inventoryQuantity": row[col] = v?.inventoryQuantity ?? ""; break;
          default: row[col] = "";
        }
      }
      rows.push(row);
    }
    // Handsontable expects array of arrays; order columns accordingly
    return rows.map(r => columns.map(c => r[c]));
  }, [products, columns]);

  const hotSettings = useMemo(() => ({
    data,
    rowHeaders: true,
    colHeaders: columns.map(c => ALL_COLUMNS.find(x => x.key === c)?.label || c),
    licenseKey: "non-commercial-and-evaluation",
    contextMenu: true,
    manualColumnResize: true,
    manualRowResize: true,
    afterChange: (changes, source) => {
      if (!changes || source === "loadData") return;
      const edits = [];
      for (const [row, prop, oldVal, newVal] of changes) {
        if (oldVal === newVal) continue;
        const product = products[row];
        const v = product?.variants?.nodes?.[0];
        const colKey = columns[prop];
        if (!product) continue;
        if (["title", "status", "category", "vendor"].includes(colKey)) {
          edits.push({ type: "product", id: product.id, [colKey]: newVal });
        } else if (["price", "sku", "inventoryQuantity"].includes(colKey) && v) {
          edits.push({ type: "variant", id: v.id, productId: product.id, [colKey]: newVal });
        }
      }
      if (edits.length) setChanged(prev => [...prev, ...edits]);
    },
  }), [data, columns, products]);

  const toggleColumn = (key) => {
    setColumns(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  };

  const saveChanges = async () => {
    if (!changed.length) return;
    setLoading(true);
    try {
      const res = await fetch("/app/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits: changed }),
      });
      const out = await res.json();
      if (!out.success) throw new Error(out.error || "Save failed");
      setChanged([]);
      // toast
      window.shopify?.toast?.show?.("Changes saved");
    } catch (e) {
      window.shopify?.toast?.show?.(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title={isLoadingProducts ? "Loading inventory..." : `Bulk edit (${products.length} products)`}
      primaryAction={{
        content: 'Save Changes',
        onAction: saveChanges,
        disabled: !changed.length || loading || isLoadingProducts,
        loading: loading,
      }}
    >
      <Layout>
        <Layout.Section>
          {isLoadingProducts && (
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">Loading all products from store...</Text>
                  <Badge tone="info">Please wait</Badge>
                </InlineStack>
                <SkeletonBodyText lines={3} />
                <Text variant="bodySm" as="p" tone="subdued">
                  Fetching all products from your store inventory. This may take a moment for large catalogs.
                </Text>
              </BlockStack>
            </Card>
          )}

          {!isLoadingProducts && (
            <>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h2">Columns</Text>
                    <InlineStack gap="200">
                      {changed.length > 0 && (
                        <Badge tone="attention">{changed.length} unsaved changes</Badge>
                      )}
                      <Badge tone="success">{products.length} products loaded</Badge>
                    </InlineStack>
                  </InlineStack>
                  <InlineStack gap="300" wrap>
                    {ALL_COLUMNS.map((c) => (
                      <Checkbox
                        key={c.key}
                        label={c.label}
                        checked={columns.includes(c.key)}
                        onChange={() => toggleColumn(c.key)}
                      />
                    ))}
                  </InlineStack>
                </BlockStack>
              </Card>

              <Card>
                <div style={{ height: 600 }}>
                  <Suspense fallback={
                    <BlockStack gap="200">
                      <SkeletonBodyText lines={12} />
                      <Text variant="bodySm" as="p" tone="subdued">Loading bulk editor...</Text>
                    </BlockStack>
                  }>
                    {products.length > 0 ? (
                      <HotTable ref={hotRef} settings={hotSettings} />
                    ) : (
                      <BlockStack gap="200" inlineAlign="center">
                        <Text variant="bodyMd" as="p" tone="subdued">No products found in your store</Text>
                      </BlockStack>
                    )}
                  </Suspense>
                </div>
              </Card>
            </>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}





