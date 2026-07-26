import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
import { copyToClipboard } from "@/lib/clipboard";
import { Plus, Phone, Instagram, Facebook, MessageCircle, User, Copy, MessagesSquare, Send } from "lucide-react";

const STATUS_COLORS = {
  new: "bg-primary/20 text-accent border-primary",
  contacted: "bg-secondary/20 text-secondary border-secondary",
  converted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  lost: "bg-muted text-muted-foreground border-border",
};

const SOURCE_ICONS = {
  "walk-in": Phone, phone: Phone, instagram: Instagram, facebook: Facebook, whatsapp: MessageCircle, referral: Phone, other: Phone,
};

const empty = { name: "", phone: "", email: "", source: "walk-in", interest: "", notes: "", status: "new" };

export default function Inquiries() {
  const { user, isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [execs, setExecs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [scope, setScope] = useState(isAdmin ? "all" : "mine");
  const [detailInq, setDetailInq] = useState(null);
  const [newRemark, setNewRemark] = useState("");
  const [webhookOpen, setWebhookOpen] = useState(false);

  const load = () => api.get("/inquiries").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => {
    load();
    if (isAdmin) api.get("/users").then((r) => setExecs(r.data.filter((u) => u.is_marketing_exec)));
  }, [isAdmin]);

  const create = async () => {
    if (!form.name || !form.phone) return toast.error("Name & phone required");
    setBusy(true);
    try {
      const { data } = await api.post("/inquiries", form);
      toast.success(data.assigned_to_name ? `Saved — assigned to ${data.assigned_to_name}` : "Saved!");
      setOpen(false); setForm(empty); load();
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };
  const updateStatus = async (id, status) => {
    try { await api.patch(`/inquiries/${id}/status`, { status }); toast.success(`Marked ${status}`); load(); if (detailInq?.id === id) setDetailInq({ ...detailInq, status }); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const addRemark = async () => {
    if (!newRemark.trim()) return;
    try {
      const { data } = await api.post(`/inquiries/${detailInq.id}/remarks`, { text: newRemark });
      setDetailInq(data); setNewRemark(""); load();
      toast.success("Remark added");
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const reassign = async (uid) => {
    try {
      const { data } = await api.patch(`/inquiries/${detailInq.id}/assign`, { assigned_to: uid || null });
      setDetailInq(data); load();
      toast.success("Reassigned");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const backendBase = process.env.REACT_APP_BACKEND_URL;
  const scoped = scope === "mine" ? list.filter((i) => i.assigned_to === user?.id) : list;
  const filtered = filter === "all" ? scoped : scoped.filter((i) => i.status === filter);

  return (
    <div>
      <PageHead
        title="Inquiries"
        subtitle="Har phone, walk-in aur social lead — auto-assigned to marketing execs"
        action={
          <div className="flex flex-wrap gap-2">
            <Button data-testid="webhook-btn" onClick={() => setWebhookOpen(true)} variant="outline" className="rounded-full h-11 px-5 font-bold"><MessagesSquare className="h-4 w-4 mr-1" /> Channel Setup</Button>
            <Button data-testid="new-inquiry-btn" onClick={() => setOpen(true)} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> New</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {!isAdmin && (
          <div className="flex gap-1 mr-3">
            <button data-testid="scope-mine" onClick={() => setScope("mine")} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${scope === "mine" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>Mine</button>
            <button data-testid="scope-all" onClick={() => setScope("all")} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${scope === "all" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>All</button>
          </div>
        )}
        {["all", "new", "contacted", "converted", "lost"].map((s) => (
          <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${filter === s ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>
            {s} {s !== "all" && `(${scoped.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No inquiries yet" description="Nayi inquiries webhook se auto aayengi ya manually add karo." action={<Button data-testid="empty-add-inquiry" onClick={() => setOpen(true)} className="rounded-full">Add first</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filtered.map((i) => {
            const Icon = SOURCE_ICONS[i.source] || Phone;
            return (
              <Card key={i.id} className="p-5 rounded-2xl hover:shadow-md transition-shadow cursor-pointer" data-testid={`inquiry-card-${i.id}`} onClick={() => setDetailInq(i)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-black text-lg">{i.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Icon className="h-3.5 w-3.5" /> {i.source}</div>
                  </div>
                  <Badge className={`rounded-full border ${STATUS_COLORS[i.status]} font-bold uppercase text-[10px] tracking-widest`}>{i.status}</Badge>
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <div><span className="text-muted-foreground">Phone: </span><span className="font-semibold">{i.phone}</span></div>
                  {i.interest && <div><span className="text-muted-foreground">Interest: </span><span className="font-semibold">{i.interest}</span></div>}
                  {i.notes && <div className="text-muted-foreground italic line-clamp-2">&quot;{i.notes}&quot;</div>}
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-secondary font-bold">
                    <User className="h-3 w-3" />
                    {i.assigned_to_name || "Unassigned"}
                  </div>
                  {(i.remarks?.length || 0) > 0 && <Badge variant="outline" className="rounded-full text-[10px]"><MessagesSquare className="h-3 w-3 mr-1" />{i.remarks.length}</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Inquiry */}
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
                  <SelectContent>{["walk-in", "phone", "instagram", "facebook", "whatsapp", "referral", "other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Interest (package/game)</Label><Input data-testid="inq-interest" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></div>
            </div>
            <div><Label>Initial Notes</Label><Textarea data-testid="inq-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="inq-save" disabled={busy} onClick={create} className="rounded-full bg-accent hover:bg-accent/90">Save (Auto-Assign)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailInq} onOpenChange={(v) => !v && setDetailInq(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailInq && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  {detailInq.name}
                  <Badge className={`rounded-full border ${STATUS_COLORS[detailInq.status]} text-[10px] uppercase`}>{detailInq.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl text-sm">
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Phone</div><div className="font-bold">{detailInq.phone}</div></div>
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Source</div><div className="font-bold capitalize">{detailInq.source}</div></div>
                  {detailInq.email && <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Email</div><div className="font-bold">{detailInq.email}</div></div>}
                  {detailInq.interest && <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Interest</div><div className="font-bold">{detailInq.interest}</div></div>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-widest">Status</Label>
                    <Select value={detailInq.status} onValueChange={(v) => updateStatus(detailInq.id, v)}>
                      <SelectTrigger data-testid="detail-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isAdmin && (
                    <div>
                      <Label className="text-xs uppercase tracking-widest">Assigned To</Label>
                      <Select value={detailInq.assigned_to || "none"} onValueChange={(v) => reassign(v === "none" ? null : v)}>
                        <SelectTrigger data-testid="detail-assign"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Unassigned —</SelectItem>
                          {execs.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!isAdmin && (
                    <div>
                      <Label className="text-xs uppercase tracking-widest">Assigned To</Label>
                      <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm font-bold">{detailInq.assigned_to_name || "Unassigned"}</div>
                    </div>
                  )}
                </div>

                {detailInq.notes && (
                  <div className="p-3 bg-primary/10 rounded-xl text-sm">
                    <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Initial notes</div>
                    <div>{detailInq.notes}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-2">Remarks / Timeline</div>
                  <div className="space-y-2 max-h-56 overflow-y-auto" data-testid="remark-list">
                    {(detailInq.remarks || []).length === 0 && <div className="text-sm text-muted-foreground italic">No remarks yet. Add pehla remark — kya problem aayi convert karne me?</div>}
                    {(detailInq.remarks || []).map((r, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <div className="text-sm">{r.text}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">— {r.by} · {new Date(r.at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Textarea data-testid="remark-input" placeholder="Kya reason? Kaunsi objection? Follow-up plan?" value={newRemark} onChange={(e) => setNewRemark(e.target.value)} rows={2} />
                    <Button data-testid="remark-add" onClick={addRemark} className="rounded-full bg-accent hover:bg-accent/90 self-end"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Webhook / Channel setup */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">Channel Setup — Auto Inquiries</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">WhatsApp, Instagram, Facebook, SMS aur Call se aane wali inquiries yahan auto-add karne ke liye niche diye URL par POST karvao (Zapier / Twilio / Meta webhook / IVR provider se). Payload: <code className="bg-muted px-1 rounded">{`{name, phone, email, message}`}</code></p>
            {["whatsapp", "instagram", "facebook", "sms", "call"].map((ch) => {
              const url = `${backendBase}/api/inquiries/webhook/${ch}`;
              return (
                <div key={ch} className="p-3 bg-muted rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold capitalize">{ch}</div>
                    <button data-testid={`copy-webhook-${ch}`} onClick={async () => { const ok = await copyToClipboard(url); toast[ok ? "success" : "info"](ok ? "Copied" : "Manual copy fallback shown"); }} className="text-xs font-bold text-secondary flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
                  </div>
                  <code className="text-xs break-all">{url}</code>
                </div>
              );
            })}
            <div className="p-4 border-2 border-dashed border-border rounded-xl text-xs">
              <div className="font-bold mb-1">Quick recipes</div>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><b>WhatsApp Business</b> → Twilio Sandbox / 360dialog → point &quot;Message received&quot; webhook to <code>/api/inquiries/webhook/whatsapp</code></li>
                <li><b>Instagram/Facebook</b> → Meta App → Webhook subscription for &quot;messages&quot; → Zapier bridge → POST here</li>
                <li><b>Missed Call / IVR</b> → Exotel/MyOperator webhook → POST here on call event</li>
                <li>Round-robin auto-assigns to staff marked &quot;Marketing Executive&quot; in Staff page</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
