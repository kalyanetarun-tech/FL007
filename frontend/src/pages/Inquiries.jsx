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
import { Plus, Phone, Instagram, Facebook, MessageCircle, User, Copy, MessagesSquare, Send, Download, Upload, FileSpreadsheet, Archive, ArchiveRestore, Trash2 } from "lucide-react";

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
  const [showArchived, setShowArchived] = useState(false);
  const [detailInq, setDetailInq] = useState(null);
  const [newRemark, setNewRemark] = useState("");
  const [webhookOpen, setWebhookOpen] = useState(false);

  const load = () => api.get("/inquiries", { params: showArchived ? { only_archived: 1 } : {} }).then((r) => setList(r.data)).catch(() => {});
  useEffect(() => {
    load();
    if (isAdmin) api.get("/users").then((r) => setExecs(r.data.filter((u) => u.is_marketing_exec)));
    // eslint-disable-next-line
  }, [isAdmin, showArchived]);

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
  const archiveInq = async (id) => {
    if (!window.confirm("Move this inquiry to archive? Data safe rahega — Archive tab se restore kar sakte ho.")) return;
    try { await api.delete(`/inquiries/${id}`); toast.success("Moved to archive"); setDetailInq(null); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const restoreInq = async (id) => {
    try { await api.post(`/inquiries/${id}/restore`); toast.success("Restored"); setDetailInq(null); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const downloadXlsx = async (path, filename) => {
    try {
      const res = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const exportXlsx = () => downloadXlsx("/inquiries/export.xlsx", `inquiries_${new Date().toISOString().slice(0,10)}.xlsx`);
  const downloadTemplate = () => downloadXlsx("/inquiries/template.xlsx", "inquiries_template.xlsx");
  const importXlsx = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/inquiries/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const msg = `Imported ${data.inserted} inquiries` + (data.skipped ? `, skipped ${data.skipped}` : "") + (data.errors?.length ? ` (${data.errors.length} errors)` : "");
      toast.success(msg);
      if (data.errors?.length) console.warn("Import errors:", data.errors);
      load();
    } catch (err) { toast.error(fmtErr(err)); }
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
            <input id="inq-import-file" type="file" accept=".xlsx,.xls" onChange={importXlsx} className="hidden" data-testid="inq-import-input" />
            <Button data-testid="inq-archive-toggle" onClick={() => setShowArchived(!showArchived)} variant={showArchived ? "default" : "outline"} className={`rounded-full h-11 px-4 font-bold ${showArchived ? "bg-primary text-primary-foreground" : ""}`}>
              <Archive className="h-4 w-4 mr-1" /> {showArchived ? "Show Active" : "Archived"}
            </Button>
            <Button data-testid="inq-template-btn" onClick={downloadTemplate} variant="outline" className="rounded-full h-11 px-4 font-bold"><FileSpreadsheet className="h-4 w-4 mr-1" /> Template</Button>
            <Button data-testid="inq-import-btn" onClick={() => document.getElementById("inq-import-file").click()} variant="outline" className="rounded-full h-11 px-4 font-bold"><Upload className="h-4 w-4 mr-1" /> Import Excel</Button>
            <Button data-testid="inq-export-btn" onClick={exportXlsx} variant="outline" className="rounded-full h-11 px-4 font-bold"><Download className="h-4 w-4 mr-1" /> Export</Button>
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
              <Card key={i.id} className={`p-5 rounded-2xl hover:shadow-md transition-shadow cursor-pointer ${i.is_deleted ? "opacity-70 border-dashed" : ""}`} data-testid={`inquiry-card-${i.id}`} onClick={() => setDetailInq(i)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-black text-lg">{i.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Icon className="h-3.5 w-3.5" /> {i.source}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`rounded-full border ${STATUS_COLORS[i.status]} font-bold uppercase text-[10px] tracking-widest`}>{i.status}</Badge>
                    {i.is_deleted && <Badge className="rounded-full bg-muted text-muted-foreground border-muted font-bold uppercase text-[9px] tracking-widest" data-testid="archived-badge">Archived</Badge>}
                  </div>
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
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
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

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {detailInq.is_deleted ? (
                    <Button data-testid="detail-restore-btn" onClick={() => restoreInq(detailInq.id)} className="rounded-full h-9 px-4 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                      <ArchiveRestore className="h-4 w-4 mr-1" /> Restore
                    </Button>
                  ) : (
                    <Button data-testid="detail-archive-btn" onClick={() => archiveInq(detailInq.id)} variant="outline" className="rounded-full h-9 px-4 font-bold text-destructive hover:bg-destructive/10 border-destructive/40">
                      <Archive className="h-4 w-4 mr-1" /> Move to Archive
                    </Button>
                  )}
                  <div className="text-[10px] text-muted-foreground self-center">Archive se restore hamesha possible hai — permanent delete kabhi nahi hoga</div>
                </div>

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
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">Auto Inquiries — Channel Setup</DialogTitle></DialogHeader>
          <ChannelSetup backendBase={backendBase} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Channel Setup panel ----------------
function ChannelSetup({ backendBase }) {
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState("whatsapp");
  useEffect(() => { api.get("/settings").then((r) => setSettings(r.data)).catch(() => {}); }, []);
  if (!settings) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  const secret = settings.inquiry_webhook_secret || "";
  const metaToken = settings.meta_verify_token || "";
  const URL = (ch) => `${backendBase}/api/inquiries/webhook/${ch}?secret=${secret}`;
  const metaUrl = `${backendBase}/api/inquiries/webhook/meta`;

  const CopyRow = ({ label, value, testid }) => (
    <div className="p-3 bg-muted rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary">{label}</div>
        <button data-testid={testid} onClick={async () => { const ok = await copyToClipboard(value); toast[ok ? "success" : "info"](ok ? "Copied" : "Manual copy shown"); }} className="text-xs font-bold text-primary flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
      </div>
      <code className="text-xs break-all font-mono">{value}</code>
    </div>
  );

  const TABS = [
    { v: "whatsapp",  label: "WhatsApp" },
    { v: "sms",       label: "SMS" },
    { v: "instagram", label: "Instagram" },
    { v: "facebook",  label: "Facebook" },
    { v: "zapier",    label: "Zapier" },
  ];

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
        <div className="font-black text-emerald-800 mb-1">Yeh secret share mat karna 🔐</div>
        <div className="text-emerald-800">Ye secret aapke webhook URL me embedded hai. Kisi ke haath lag gaya to woh bogus inquiries daal sakta hai. Settings me kabhi bhi rotate kar sakte ho.</div>
      </div>
      <CopyRow label="Your webhook secret" value={secret} testid="copy-webhook-secret" />

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button key={t.v} data-testid={`ch-tab-${t.v}`} onClick={() => setTab(t.v)} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${tab === t.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "whatsapp" && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Phase 1 — WhatsApp Business App (FREE, aaj chalu)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <div className="font-bold">Setup via Android SMS/Notification Forwarder (5 min):</div>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Funland ke WhatsApp Business phone pe install karo: <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://play.google.com/store/apps/details?id=io.github.bareya.smsforwarder">SMS Forwarder</a> ya <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://play.google.com/store/apps/details?id=de.k3b.android.smsimport">MacroDroid + Webhook</a></li>
              <li>App me: <b>Add Rule</b> → Trigger: WhatsApp Notification / New Message → Action: <b>Webhook POST</b></li>
              <li>URL me neeche wala copy-paste karo, method POST, content-type JSON:</li>
            </ol>
          </div>
          <CopyRow label="WhatsApp webhook URL" value={URL("whatsapp")} testid="copy-url-whatsapp" />
          <div className="p-3 bg-muted rounded-xl text-xs">
            <div className="font-bold mb-1">Body template (paste in the app):</div>
            <code className="block font-mono text-[10px] whitespace-pre">{`{
  "name": "{{sender}}",
  "phone": "{{sender}}",
  "message": "{{text}}"
}`}</code>
          </div>

          <div className="text-xs uppercase tracking-widest font-black text-secondary mt-6">Phase 2 — Meta WhatsApp Cloud API (FREE tier, verified)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Go to <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://developers.facebook.com/apps/">developers.facebook.com/apps</a> → Create App → Business → add <b>WhatsApp</b> product</li>
              <li>Webhook section me Callback URL neeche wala paste karo, Verify Token bhi neeche wala:</li>
            </ol>
          </div>
          <CopyRow label="Meta Callback URL" value={metaUrl} testid="copy-meta-url" />
          <CopyRow label="Meta Verify Token" value={metaToken} testid="copy-meta-token" />
          <div className="p-3 bg-muted rounded-xl text-xs">Subscribe fields: <b>messages</b>. Meta ki verification pass hote hi live inquiries flow hone lagengi.</div>

          <div className="text-xs uppercase tracking-widest font-black text-secondary mt-6">Alternative — Twilio WhatsApp (paid, 2-3 din)</div>
          <div className="p-4 border border-border rounded-xl text-xs">
            <div className="font-bold mb-1">Twilio Console → Messaging → Settings → WhatsApp Sandbox / Sender:</div>
            <div className="text-muted-foreground">Point "When a message comes in" webhook to URL below (POST). Twilio bheji hui form-urlencoded body auto-parse ho jayegi.</div>
          </div>
          <CopyRow label="Twilio WhatsApp webhook URL" value={URL("twilio")} testid="copy-url-twilio-wa" />
        </div>
      )}

      {tab === "sms" && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Phase 1 — Android SMS Forwarder (FREE)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Play Store se install karo: <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://play.google.com/store/apps/details?id=tech.bogomolov.incomingsmsgateway">SMS to URL Forwarder</a></li>
              <li>App khol ke <b>Add rule</b> → Sender: * (all), URL: neeche wala paste karo, JSON body:</li>
            </ol>
            <div className="p-3 bg-background rounded mt-2">
              <code className="block font-mono text-[10px] whitespace-pre">{`{ "from": "%from%", "text": "%text%", "sentStamp": "%sentStamp%" }`}</code>
            </div>
            <div className="text-muted-foreground">SMS aate hi auto-forward ho jayegi CRM me — koi cost nahi.</div>
          </div>
          <CopyRow label="SMS webhook URL" value={URL("sms")} testid="copy-url-sms" />

          <div className="text-xs uppercase tracking-widest font-black text-secondary mt-6">Alternative — Twilio SMS / MSG91 (paid)</div>
          <div className="p-3 bg-muted rounded-xl text-xs">Twilio ka "Inbound SMS webhook" ho MSG91 ka "Two-way SMS Webhook" — dono aapka URL <code>{URL("twilio")}</code> pe POST karenge. Body auto-parse.</div>
        </div>
      )}

      {(tab === "instagram" || tab === "facebook") && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Meta Business API (Instagram + Facebook — same setup)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li><b>Prep:</b> Aapke pass Instagram Business account (Facebook Page se linked) hona chahiye. Personal account nahi chalega.</li>
              <li>Go to <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://developers.facebook.com/apps/">developers.facebook.com/apps</a> → Create App → Business type</li>
              <li>Add products: <b>Instagram Graph API</b> + <b>Messenger</b> + (optional) <b>WhatsApp</b></li>
              <li>Webhook section me: Callback URL + Verify Token daalo (neeche se copy karo)</li>
              <li>Subscribe to fields: <code>messages</code>, <code>messaging_postbacks</code>, <code>messaging_referrals</code></li>
              <li>App Review submit karo (~1-2 hafte). Approval ke baad live inquiries aane lagengi.</li>
            </ol>
          </div>
          <CopyRow label="Meta Callback URL" value={metaUrl} testid={`copy-meta-url-${tab}`} />
          <CopyRow label="Meta Verify Token" value={metaToken} testid={`copy-meta-token-${tab}`} />
          {tab === "instagram" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <b>Bonus:</b> Bina API ke, tab tak aap Instagram Story / Post ki DMs ko manually Zapier "Instagram for Business → Zap" se bhi CRM ko pass kar sakte ho (Zapier tab dekho).
            </div>
          )}
        </div>
      )}

      {tab === "zapier" && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Zapier — universal bridge (FREE 100 tasks/month)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Sign up at <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://zapier.com/">zapier.com</a></li>
              <li>Create Zap → Trigger: (any app — Instagram / FB / Gmail / SMS / Webhook)</li>
              <li>Action: <b>Webhooks by Zapier</b> → <b>POST</b> → URL below → Data: map fields <code>name</code>, <code>phone</code>, <code>message</code></li>
            </ol>
          </div>
          <CopyRow label="Zapier POST URL (choose source)" value={URL("whatsapp")} testid="copy-url-zapier" />
          <div className="text-xs text-muted-foreground">Har channel ka URL Zap me alag rakhna — path ke last part ko badalke (whatsapp / sms / instagram / facebook / call / other). Zapier ke free plan me ~100 inquiries/month auto process ho jayengi.</div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
        Sab channels round-robin se aapke <b>Marketing Executive</b> staff members me distribute honge. Staff page pe checkbox laga do.
      </div>
    </div>
  );
}
