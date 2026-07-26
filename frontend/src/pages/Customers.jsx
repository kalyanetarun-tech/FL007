import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Mail, Wallet, Calendar } from "lucide-react";

export function CustomersList() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/customers").then((r) => setList(r.data)).catch(() => {}); }, []);
  const filtered = list.filter((c) => (c.name + " " + (c.phone || "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHead title="Customers" subtitle="Sabhi customers ka history aur spend" />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input data-testid="cust-search" placeholder="Search name/phone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" />
      </div>
      {filtered.length === 0 ? <EmptyState title="No customers yet" description="Bills banate hi customers yahan auto save honge." /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((c) => (
            <Link key={c.id} to={`/customers/${encodeURIComponent(c.key)}`} data-testid={`cust-card-${c.id}`}>
              <Card className="p-5 rounded-2xl hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-lg">{c.name?.[0]?.toUpperCase() || "?"}</div>
                  <div className="min-w-0">
                    <div className="font-black truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-muted-foreground uppercase tracking-widest font-bold">Visits</div><div className="font-black text-lg">{c.visits}</div></div>
                  <div><div className="text-muted-foreground uppercase tracking-widest font-bold">Spent</div><div className="font-black text-lg text-accent">{inr(c.total_spent)}</div></div>
                </div>
                <div className="text-xs text-muted-foreground mt-3">Last visit: {new Date(c.last_visit).toLocaleDateString()}</div>
              </Card>
            </Link>
          ))}
        </div>}
    </div>
  );
}

export function CustomerDetail() {
  const { key } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/customers/${encodeURIComponent(key)}`).then((r) => setData(r.data)).catch(() => {}); }, [key]);
  if (!data) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const c = data.customer;
  return (
    <div>
      <PageHead title={c.name} subtitle={`${c.visits} visits · ${inr(c.total_spent)} lifetime spend`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Profile</div>
          <div className="space-y-3 text-sm">
            <Row icon={User} label="Name" value={c.name} />
            <Row icon={Phone} label="Phone" value={c.phone || "—"} />
            <Row icon={Mail} label="Email" value={c.email || "—"} />
            <Row icon={Wallet} label="Total Spent" value={inr(c.total_spent)} bold />
            <Row icon={Calendar} label="First Visit" value={new Date(c.first_visit).toLocaleDateString()} />
            <Row icon={Calendar} label="Last Visit" value={new Date(c.last_visit).toLocaleDateString()} />
          </div>
        </Card>
        <Card className="p-6 rounded-2xl lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Visit History</div>
          {data.bills.length === 0 ? <div className="text-sm text-muted-foreground">No bills yet.</div> :
            <div className="space-y-2" data-testid="cust-history">
              {data.bills.map((b) => (
                <Link key={b.id} to={`/bills/${b.id}`} className="block p-3 bg-muted rounded-lg hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold">{b.bill_no}</div>
                    <div className="text-sm font-black text-accent">{inr(b.total)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{b.items?.length} items · {b.payment_method}</span>
                    <Badge variant="outline" className="rounded-full text-[10px]">{b.payment_status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(b.created_at).toLocaleString()}</div>
                </Link>
              ))}
            </div>}
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, bold }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="text-muted-foreground text-xs uppercase tracking-widest font-bold w-24">{label}</div>
      <div className={`flex-1 ${bold ? "font-black text-accent" : "font-semibold"}`}>{value}</div>
    </div>
  );
}
