import { Refine } from "@refinedev/core";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  ListTodo,
  PackageSearch,
} from "lucide-react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";

import "./App.css";
import { Layout } from "./components/refine-ui/layout/layout";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { BranchCommandCenter } from "./pages/overview";
import { PlaceholderPage } from "./pages/placeholder-page";

const resources = [
  { name: "overview", list: "/overview", meta: { label: "Overview" } },
  { name: "actions", list: "/actions", meta: { label: "Action Center" } },
  { name: "batches", list: "/batches", meta: { label: "Batches" } },
  { name: "products", list: "/products", meta: { label: "Products" } },
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
              <Route
                path="/overview"
                element={<BranchCommandCenter />}
              />
              <Route
                path="/actions"
                element={
                  <PlaceholderPage
                    icon={ListTodo}
                    eyebrow="Operations"
                    title="Action Center"
                    description="A focused workspace for the exceptions and follow-ups that need operational attention."
                  />
                }
              />
              <Route
                path="/batches"
                element={
                  <PlaceholderPage
                    icon={Boxes}
                    eyebrow="Operations"
                    title="Batches"
                    description="The future home for batch-level stock visibility, expiry status, and FIFO execution."
                  />
                }
              />
              <Route
                path="/products"
                element={
                  <PlaceholderPage
                    icon={PackageSearch}
                    eyebrow="Intelligence"
                    title="Products"
                    description="A product intelligence view for inventory position, movement, exposure, and performance."
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <PlaceholderPage
                    icon={BarChart3}
                    eyebrow="Intelligence"
                    title="Analytics"
                    description="A reporting surface for loss trends, expiry risk, FIFO adherence, and operational outcomes."
                  />
                }
              />
              <Route
                path="/audits"
                element={
                  <PlaceholderPage
                    icon={ClipboardCheck}
                    eyebrow="Control"
                    title="Audits"
                    description="A control workspace for review history, accountability, and operational traceability."
                  />
                }
              />
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
