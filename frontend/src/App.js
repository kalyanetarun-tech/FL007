import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
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
import Settings from "@/pages/Settings";
import { CustomersList, CustomerDetail } from "@/pages/Customers";
import PrintBill from "@/pages/PrintBill";
import { Loader2 } from "lucide-react";

function Protected({ children, adminOnly }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/inquiries" element={<Protected><Inquiries /></Protected>} />
          <Route path="/visit" element={<Protected><NewVisit /></Protected>} />
          <Route path="/bills" element={<Protected><BillsList /></Protected>} />
          <Route path="/bills/:id" element={<Protected><BillDetail /></Protected>} />
          <Route path="/bills/:id/print" element={<PrintBill />} />
          <Route path="/customers" element={<Protected><CustomersList /></Protected>} />
          <Route path="/customers/:key" element={<Protected><CustomerDetail /></Protected>} />
          <Route path="/games" element={<Protected><Games /></Protected>} />
          <Route path="/packages" element={<Protected><Packages /></Protected>} />
          <Route path="/attendance" element={<Protected><Attendance /></Protected>} />
          <Route path="/staff" element={<Protected adminOnly><Staff /></Protected>} />
          <Route path="/marketing" element={<Protected adminOnly><Marketing /></Protected>} />
          <Route path="/settings" element={<Protected adminOnly><Settings /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
