import { Refine } from "@refinedev/core";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";

import "./App.css";
import { Layout } from "./components/refine-ui/layout/layout";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { OverviewPage } from "./pages/overview";
import { ActionCenterPage } from "./pages/actions";
import { BatchesPage } from "./pages/batches";
import { AuditsPage } from "./pages/audits";
import { AnalyticsPage } from "./pages/analytics";
import { ProductIntelligencePage } from "./pages/products/detail";
import { MasterProductsPage } from "./pages/products";

const resources = [
  { name: "overview", list: "/overview", meta: { label: "Overview" } },
  { name: "actions", list: "/actions", meta: { label: "Action Center" } },
  { name: "batches", list: "/batches", meta: { label: "Batches" } },
  {
    name: "products",
    list: "/products",
    show: "/products/:id",
    meta: { label: "Products" },
  },
  { name: "analytics", list: "/analytics", meta: { label: "Analytics" } },
  { name: "audits", list: "/audits", meta: { label: "Audits" } },
];

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider storageKey="nems-ui-theme">
        <Refine
          routerProvider={routerProvider}
          resources={resources}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <Routes>
            <Route
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }
            >
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/actions" element={<ActionCenterPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/products">
                <Route index element={<MasterProductsPage />} />
                <Route path=":id" element={<ProductIntelligencePage />} />
              </Route>
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/audits" element={<AuditsPage />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>

          <Toaster />
          <UnsavedChangesNotifier />
          <DocumentTitleHandler
            handler={({ resource }) =>
              `${resource?.meta?.label ?? "Overview"} | NEMS`
            }
          />
        </Refine>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
