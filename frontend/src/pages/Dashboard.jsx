import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { inr } from "@/lib/api";
import { Wallet, Users, MessageSquare, Receipt, TrendingUp, Trophy } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get("/dashboard/stats").then((r) => mounted && setStats(r.data)).catch(() => mounted && setError(true));
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <PageHead
        title={`Namaste, ${user?.name?.split(" ")[0] || "Manager"} 🎡`}
        subtitle="Aaj ke park operations aur revenue ka overview"
        action={
          <div className="flex gap-3">
            <Link to="/visit"><Button data-testid="dash-new-bill" className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold">+ New Bill</Button></Link>
            <Link to="/inquiries"><Button data-testid="dash-new-inquiry" variant="outline" className="rounded-full h-11 px-6 font-bold">+ Inquiry</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        <KpiCard icon={Wallet} tint="bg-primary/20 text-accent" label="Aaj ka revenue" value={stats ? inr(stats.revenue_today) : "—"} testid="kpi-revenue" />
        <KpiCard icon={Users} tint="bg-secondary/20 text-secondary" label="Aaj ki footfall" value={stats?.footfall_today ?? "—"} testid="kpi-footfall" />
        <KpiCard icon={MessageSquare} tint="bg-accent/20 text-accent" label="Nayi inquiries" value={stats?.inquiries_new ?? "—"} testid="kpi-inq-new" />
        <KpiCard icon={Receipt} tint="bg-destructive/10 text-destructive" label="Pending bills" value={stats?.pending_bills ?? "—"} testid="kpi-pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Last 7 days</div>
              <h3 className="text-xl font-black">Revenue trend</h3>
            </div>
            <TrendingUp className="text-secondary h-6 w-6" />
          </div>
          <div className="h-64">
            {stats?.revenue_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenue_trend}>
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => inr(v)} />
                  <Bar dataKey="revenue" fill="hsl(28 100% 49%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Top games</div>
              <h3 className="text-xl font-black">Popular rides</h3>
            </div>
            <Trophy className="text-primary h-6 w-6" />
          </div>
          {stats?.top_games?.length ? (
            <ul className="space-y-3" data-testid="top-games-list">
              {stats.top_games.map((g, i) => (
                <li key={g.name} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-black text-sm flex items-center justify-center">{i + 1}</span>
                    <span className="font-bold">{g.name}</span>
                  </div>
                  <span className="text-sm font-bold text-secondary">{g.count} plays</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground text-sm py-8 text-center">No plays logged yet.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, tint, label, value, testid }) {
  return (
    <Card className="p-6 rounded-2xl border-border hover:shadow-md transition-shadow" data-testid={testid}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
    </Card>
  );
}
