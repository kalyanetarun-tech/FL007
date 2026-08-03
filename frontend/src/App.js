import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inquiries from "@/pages/Inquiries";
import Games from "@/pages/Games";
import Packages from "@/pages/Packages";
import NewVisit from "@/pages/NewVisit";
import { BillsList, BillDetail } from "@/pages/Bills";
import Attendance from "@/pages/Attendance";
import Staff from "@/pages/Staff";
import Marketing from "@/pages/Marketing";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import { CustomersList, CustomerDetail } from "@/pages/Customers";
import PrintBill from "@/pages/PrintBill";
import Prebookings from "@/pages/Prebookings";
import { PublicBook, PublicBookConfirm } from "@/pages/PublicBook";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConnectionStatus from "@/components/ConnectionStatus";
import InstallPWA from "@/components/InstallPWA";
import { Loader2 } from "lucide-react";

function Protected({ children, adminOnly, perm }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (perm && !isAdmin && !(user.permissions || []).includes(perm)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  // Warm-up ping the backend as soon as the app opens so cold-start latency is hidden
  useEffect(() => {
    api.get("/health").catch(() => {});
    // Keep-alive ping every 4 min so backend stays warm during active use
    const t = setInterval(() => { api.get("/health").catch(() => {}); }, 4 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <ConnectionStatus />
          <InstallPWA />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/book" element={<PublicBook />} />
            <Route path="/book/:id" element={<PublicBookConfirm />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/prebookings" element={<Protected perm="prebookings"><Prebookings /></Protected>} />
            <Route path="/inquiries" element={<Protected perm="inquiries"><Inquiries /></Protected>} />
            <Route path="/visit" element={<Protected perm="visit"><NewVisit /></Protected>} />
            <Route path="/bills" element={<Protected perm="bills"><BillsList /></Protected>} />
            <Route path="/bills/:id" element={<Protected perm="bills"><BillDetail /></Protected>} />
            <Route path="/bills/:id/print" element={<PrintBill />} />
            <Route path="/customers" element={<Protected perm="customers"><CustomersList /></Protected>} />
            <Route path="/customers/:key" element={<Protected perm="customers"><CustomerDetail /></Protected>} />
            <Route path="/games" element={<Protected perm="games"><Games /></Protected>} />
            <Route path="/packages" element={<Protected perm="packages"><Packages /></Protected>} />
            <Route path="/attendance" element={<Protected perm="attendance"><Attendance /></Protected>} />
            <Route path="/staff" element={<Protected adminOnly><Staff /></Protected>} />
            <Route path="/marketing" element={<Protected adminOnly><Marketing /></Protected>} />
            <Route path="/reports" element={<Protected adminOnly><Reports /></Protected>} />
            <Route path="/settings" element={<Protected adminOnly><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
