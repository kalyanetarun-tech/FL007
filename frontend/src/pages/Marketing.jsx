import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Instagram, Facebook, MessageCircle, Send, Mail, Phone, Copy } from "lucide-react";

const CHANNEL_ICON = { instagram: Instagram, facebook: Facebook, whatsapp: MessageCircle, sms: Phone, email: Mail };

const TEMPLATES = [
  { title: "Weekend Offer", message: "🎡 Weekend special at Funland! Flat 20% off on all rides. Book now: Funland Adventure Park, Indore. Call to reserve!" },
  { title: "Birthday Package", message: "🎂 Make birthdays unforgettable at Funland! Full birthday package with games, cake & decoration. DM us for booking." },
  { title: "Summer Camp", message: "☀️ Summer holidays at Funland! Unlimited rides, food & fun. Special group discounts for families." },
];

export default function Marketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ title: "", channel: "whatsapp", message: "", image_url: "", audience: "all_customers", custom_phones: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/campaigns").then((r) => setCampaigns(r.data)).catch(() => {});
  useEffect(() => { load(); api.get("/integrations/status").then((r) => setStatus(r.data)); }, []);

  const send = async () => {
    if (!form.title || !form.message) return toast.error("Title & message required");
    setBusy(true);
    try {
      const payload = { ...form, custom_phones: form.custom_phones ? form.custom_phones.split(",").map((s) => s.trim()) : [] };
      const { data } = await api.post("/campaigns", payload);
      if (data.status === "draft") toast.success(`Draft saved for ${data.channel}. Copy & post manually!`);
      else if (data.status === "sent") toast.success(`Sent to ${data.sent_count}/${data.target_count}`);
      else toast.error("Send failed. Check integration credentials.");
      load();
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };

  const copyMsg = () => { navigator.clipboard.writeText(form.message); toast.success("Message copied"); };

  return (
    <div>
      <PageHead title="Marketing" subtitle="Instagram, Facebook aur WhatsApp par customers tak pahucho" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Compose Campaign</div>
          <div className="space-y-4">
            <div><Label>Title / Campaign Name</Label><Input data-testid="mk-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Channel</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                {["instagram", "facebook", "whatsapp", "sms", "email"].map((c) => {
                  const Icon = CHANNEL_ICON[c];
                  const active = form.channel === c;
                  return (
                    <button key={c} data-testid={`mk-ch-${c}`} onClick={() => setForm({ ...form, channel: c })} className={`p-3 rounded-xl border-2 transition-colors ${active ? "border-accent bg-accent/10" : "border-border"}`}>
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-xs font-bold capitalize">{c}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger data-testid="mk-audience"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_customers">All Customers (from bills)</SelectItem>
                  <SelectItem value="recent_customers">Recent Customers (30 days)</SelectItem>
                  <SelectItem value="inquiries">Inquiries</SelectItem>
                  <SelectItem value="custom">Custom Phone List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience === "custom" && (
              <div><Label>Phone numbers (comma separated)</Label><Textarea data-testid="mk-custom-phones" value={form.custom_phones} onChange={(e) => setForm({ ...form, custom_phones: e.target.value })} placeholder="+919999999999, +918888888888" /></div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <Label>Message*</Label>
                <button onClick={copyMsg} className="text-xs text-secondary font-bold flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
              </div>
              <Textarea data-testid="mk-message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div><Label>Image URL (for social posts)</Label><Input data-testid="mk-image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            {["instagram", "facebook"].includes(form.channel) && (
              <div className="p-3 bg-primary/10 rounded-xl text-xs">Social posts: We save this as a draft. Copy the message and post from your Instagram/Facebook app.</div>
            )}
            {form.channel === "whatsapp" && status && !status.twilio_whatsapp && (
              <div className="p-3 bg-primary/10 rounded-xl text-xs">Twilio WhatsApp not configured — sends will be simulated. Add credentials in backend .env.</div>
            )}
            <Button data-testid="mk-send" onClick={send} disabled={busy} className="w-full h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black">
              <Send className="h-4 w-4 mr-2" /> {["instagram", "facebook"].includes(form.channel) ? "Save Draft" : "Send Campaign"}
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Quick Templates</div>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button key={t.title} data-testid={`tpl-${t.title}`} onClick={() => setForm({ ...form, title: t.title, message: t.message })} className="w-full text-left p-3 bg-muted rounded-lg hover:bg-secondary/20 transition-colors">
                  <div className="font-bold text-sm">{t.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.message}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Recent Campaigns</div>
            {campaigns.length === 0 ? <div className="text-sm text-muted-foreground">No campaigns yet.</div> :
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {campaigns.map((c) => {
                  const Icon = CHANNEL_ICON[c.channel] || MessageCircle;
                  return (
                    <div key={c.id} className="p-3 bg-muted rounded-lg" data-testid={`campaign-${c.id}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-secondary" />
                        <div className="font-bold text-sm flex-1">{c.title}</div>
                        <Badge variant="outline" className="rounded-full text-[10px]">{c.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{c.message}</div>
                      <div className="text-xs mt-1 flex justify-between">
                        <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                        {c.channel !== "instagram" && c.channel !== "facebook" && <span className="font-bold">{c.sent_count}/{c.target_count}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
