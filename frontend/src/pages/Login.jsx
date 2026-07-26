import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fmtErr } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("admin@funland.in");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Welcome back!");
      nav("/");
    } catch (err) {
      toast.error(fmtErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block confetti-bg">
        <img src="https://images.pexels.com/photos/17467601/pexels-photo-17467601.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
             alt="Amusement park" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 via-secondary/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="text-xs uppercase tracking-[0.3em] font-bold mb-4 opacity-90">Adventure Park · Indore</div>
          <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] mb-4" style={{fontFamily: 'Fraunces, serif'}}>
            Manage every ride, every smile.
          </h1>
          <p className="text-lg opacity-90 max-w-md">Inquiries, packages, billing, staff and marketing — all in one playful command center.</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-black text-2xl">F</span>
            </div>
            <div>
              <div className="text-2xl font-black">
                <span className="text-accent">Fun</span><span className="text-secondary">land</span>
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Manager Login</div>
            </div>
          </div>

          <h2 className="text-3xl font-black mb-2 tracking-tight">Sign in</h2>
          <p className="text-muted-foreground mb-8">Use your Funland credentials.</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="uppercase text-xs font-bold tracking-[0.2em]">Email</Label>
              <Input id="email" data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 h-12" />
            </div>
            <div>
              <Label htmlFor="password" className="uppercase text-xs font-bold tracking-[0.2em]">Password</Label>
              <Input id="password" data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 h-12" />
            </div>
            <Button data-testid="login-submit" type="submit" disabled={busy}
              className="w-full h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black text-base">
              {busy ? <Loader2 className="animate-spin h-5 w-5" /> : "Enter Funland"}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-muted rounded-xl text-xs">
            <div className="font-bold mb-1">Default Admin</div>
            <div className="text-muted-foreground">admin@funland.in / Funland@123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
