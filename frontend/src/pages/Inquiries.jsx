import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Phone, Instagram, Facebook, MessageCircle } from "lucide-react";

const STATUS_COLORS = {
  new: "bg-primary/20 text-accent border-primary",
  contacted: "bg-secondary/20 text-secondary border-secondary",
  converted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  lost: "bg-muted text-muted-foreground border-border",
};

const SOURCE_ICONS = {
  "walk-in": Phone,
  phone: Phone,
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
  referral: Phone,
  other: Phone,
};

const empty = { name: "", phone: "", email: "", source: "walk-in", interest: "", notes: "", status: "new" };

export default function Inquiries() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = () => api.get("/inquiries").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.phone) return toast.error("Name & phone required");
    setBusy(true);
    try {
      await api.post("/inquiries", form);
      toast.success("Inquiry saved!");
      setOpen(false);
      setForm(empty);
      load();
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/inquiries/${id}/status`, { status });
      toast.success(`Marked ${status}`);
      load();
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const filtered = filter === "all" ? list : list.filter((i) => i.status === filter);

  return (
    <div>
      <PageHead
        title="Inquiries"
        subtitle="Har phone, walk-in aur social lead ek jagah"
        action={<Button data-testid="new-inquiry-btn" onClick={() => setOpen(true)} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> New Inquiry</Button>}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "new", "contacted", "converted", "lost"].map((s) => (
          <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${filter === s ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>
            {s} {s !== "all" && `(${list.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No inquiries yet" description="Naye lead add karke shuru karo." action={<Button data-testid="empty-add-inquiry" onClick={() => setOpen(true)} className="rounded-full">Add first inquiry</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filtered.map((i) => {
            const Icon = SOURCE_ICONS[i.source] || Phone;
            return (
              <Card key={i.id} className="p-5 rounded-2xl hover:shadow-md transition-shadow" data-testid={`inquiry-card-${i.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-black text-lg">{i.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Icon className="h-3.5 w-3.5" /> {i.source}</div>
                  </div>
                  <Badge className={`rounded-full border ${STATUS_COLORS[i.status]} font-bold uppercase text-[10px] tracking-widest`}>{i.status}</Badge>
                </div>
                <div className="text-sm space-y-1 mb-4">
                  <div><span className="text-muted-foreground">Phone: </span><span className="font-semibold">{i.phone}</span></div>
                  {i.email && <div className="text-muted-foreground truncate">{i.email}</div>}
                  {i.interest && <div><span className="text-muted-foreground">Interest: </span><span className="font-semibold">{i.interest}</span></div>}
                  {i.notes && <div className="text-muted-foreground italic">&quot;{i.notes}&quot;</div>}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">by {i.created_by_name}</span>
                  <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v)}>
                    <SelectTrigger className="h-8 w-36 text-xs" data-testid={`status-select-${i.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">New Inquiry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="inq-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone*</Label><Input data-testid="inq-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input data-testid="inq-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger data-testid="inq-source"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["walk-in", "phone", "instagram", "facebook", "whatsapp", "referral", "other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Interest (package/game)</Label><Input data-testid="inq-interest" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea data-testid="inq-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="inq-save" disabled={busy} onClick={create} className="rounded-full bg-accent hover:bg-accent/90">Save Inquiry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
