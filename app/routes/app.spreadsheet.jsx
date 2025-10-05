import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Page, Layout, Card, Button, InlineStack, SkeletonBodyText, BlockStack, Text } from "@shopify/polaris";
import Papa from "papaparse";
import FileSaver from "file-saver";
import { authenticate } from "../shopify.server";

// Lazy load heavy dependencies
const HotTable = lazy(() => import("@handsontable/react").then(m => ({ default: m.HotTable })));
const Handsontable = lazy(() => import("handsontable"));
const HyperFormula = lazy(() => import("hyperformula").then(m => ({ default: m.HyperFormula })));

// Lazy load CSS
if (typeof window !== 'undefined') {
  import("handsontable/dist/handsontable.full.min.css");
}

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function SpreadsheetPage() {
  const [data, setData] = useState([[
    "Product", "Price", "Stock", "Category"
  ], [
    "Example A", 12.5, 34, "Default"
  ]]);
  const hotRef = useRef(null);

  const settings = useMemo(() => ({
    data,
    rowHeaders: true,
    colHeaders: true,
    dropdownMenu: true,
    contextMenu: true,
    filters: true,
    columnSorting: true,
    manualColumnResize: true,
    manualRowResize: true,
    mergeCells: true,
    formulas: {
      engine: HyperFormula,
    },
    licenseKey: "non-commercial-and-evaluation",
  }), [data]);

  const importCsv = (file) => {
    Papa.parse(file, {
      complete: (results) => {
        const rows = results.data.filter(r => Array.isArray(r) && r.length > 0);
        if (rows.length > 0) setData(rows);
      },
    });
  };

  const exportCsv = () => {
    const content = Papa.unparse(data);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    FileSaver.saveAs(blob, `sheet-${Date.now()}.csv`);
  };

  const addRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    hot.alter("insert_row", hot.countRows());
  };

  const addColumn = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    hot.alter("insert_col", hot.countCols());
  };

  return (
    <Page
      title="Spreadsheet Editor"
      primaryAction={{
        content: 'Export CSV',
        onAction: exportCsv,
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Controls</Text>
              <InlineStack gap="200" wrap>
                <Button onClick={addRow}>Add Row</Button>
                <Button onClick={addColumn}>Add Column</Button>
                <Button onClick={() => hotRef.current?.hotInstance?.undo()}>Undo</Button>
                <Button onClick={() => hotRef.current?.hotInstance?.redo()}>Redo</Button>
                <Button onClick={() => hotRef.current?.hotInstance?.getPlugin('mergeCells')?.mergeSelection()}>Merge</Button>
                <Button onClick={() => hotRef.current?.hotInstance?.getPlugin('mergeCells')?.unmergeSelection()}>Unmerge</Button>
                <Button onClick={() => hotRef.current?.hotInstance?.updateSettings({
                  cells: (row, col) => ({ className: 'htLeft htVTop' })
                })}>Align Left/Top</Button>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importCsv(f);
                  }}
                  style={{ padding: '8px' }}
                />
              </InlineStack>
            </BlockStack>
          </Card>

          <Card>
            <div style={{ height: 600 }}>
              <Suspense fallback={
                <BlockStack gap="200">
                  <SkeletonBodyText lines={10} />
                  <Text variant="bodySm" as="p" tone="subdued">Loading spreadsheet editor...</Text>
                </BlockStack>
              }>
                <HotTable ref={hotRef} settings={settings} />
              </Suspense>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

