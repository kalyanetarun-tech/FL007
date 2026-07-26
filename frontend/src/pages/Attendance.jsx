import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, CalendarDays } from "lucide-react";

function fmtTime(iso) { return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"; }
function fmtDate(d) { return new Date(d).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }); }

export default function Attendance() {
  const { user, isAdmin } = useAuth();
  const [today, setToday] = useState(null);
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const load = async () => {
    try {
      const t = await api.get("/attendance/today"); setToday(t.data);
      const m = await api.get("/attendance/me"); setMine(m.data);
      if (isAdmin) { const a = await api.get("/attendance/all"); setAll(a.data); }
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, [isAdmin]);

  const doCheckIn = async () => {
    try { await api.post("/attendance/checkin", { notes: "" }); toast.success("Checked in!"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const doCheckOut = async () => {
    try { await api.post("/attendance/checkout"); toast.success("Checked out!"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const canCheckIn = !today || !today.check_in;
  const canCheckOut = today && today.check_in && !today.check_out;

  return (
    <div>
      <PageHead title="Attendance" subtitle="Aaj ki punch aur weekly log" />

      <Card className="p-6 rounded-2xl mb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-secondary/10" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-1">Aaj</div>
            <div className="text-5xl font-black tracking-tight tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            <div className="text-sm text-muted-foreground mt-1">{now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
          <div className="flex gap-3">
            <Button data-testid="check-in-btn" disabled={!canCheckIn} onClick={doCheckIn} className={`h-14 px-8 rounded-full font-black text-base ${canCheckIn ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}>
              <LogIn className="h-5 w-5 mr-2" /> Check In
            </Button>
            <Button data-testid="check-out-btn" disabled={!canCheckOut} onClick={doCheckOut} className={`h-14 px-8 rounded-full font-black text-base ${canCheckOut ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`} variant={canCheckOut ? "default" : "outline"}>
              <LogOut className="h-5 w-5 mr-2" /> Check Out
            </Button>
          </div>
        </div>
        {today && (
          <div className="relative mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Check-In</div><div className="text-lg font-black">{fmtTime(today.check_in)}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Check-Out</div><div className="text-lg font-black">{fmtTime(today.check_out)}</div></div>
          </div>
        )}
      </Card>

      <Card className="p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-2 mb-4"><CalendarDays className="h-5 w-5 text-secondary" /><div className="font-black text-lg">Meri last 60 days ki attendance</div></div>
        {mine.length === 0 ? <div className="text-sm text-muted-foreground">No records yet.</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {mine.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                <div className="font-bold">{fmtDate(r.date)}</div>
                <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-secondary" /><span>{fmtTime(r.check_in)} → {fmtTime(r.check_out)}</span></div>
              </div>
            ))}
          </div>}
      </Card>

      {isAdmin && (
        <Card className="p-6 rounded-2xl">
          <div className="font-black text-lg mb-4">Team attendance (last 30 days)</div>
          {all.length === 0 ? <div className="text-sm text-muted-foreground">No punches yet.</div> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="py-2">Staff</th><th className="py-2">Date</th><th className="py-2">In</th><th className="py-2">Out</th>
                  </tr>
                </thead>
                <tbody data-testid="all-attendance-tbody">
                  {all.map((r) => (
                    <tr key={r.id} className="border-b border-border">
                      <td className="py-3 font-bold">{r.user_name}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{fmtTime(r.check_in)}</td>
                      <td>{fmtTime(r.check_out)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </Card>
      )}
    </div>
  );
}
