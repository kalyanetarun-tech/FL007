import React, { useEffect, useState } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PartyPopper } from "lucide-react";

const empty = { name: "", type: "birthday", price: 0, offer_price: null, pax: 10, inclusions: "", description: "", active: true };

export default function Packages() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/packages").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Name & price required");
    const inclusions = typeof form.inclusions === "string" ? form.inclusions.split(",").map((s) => s.trim()).filter(Boolean) : form.inclusions;
    const payload = { ...form, inclusions, price: +form.price, offer_price: form.offer_price ? +form.offer_price : null, pax: +form.pax || 1 };
    try {
      if (editing) await api.patch(`/packages/${editing}`, payload);
      else await api.post("/packages", payload);
      toast.success("Saved!"); setOpen(false); setForm(empty); setEditing(null); load();
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const remove = async (id) => { if (!window.confirm("Delete package?")) return; try { await api.delete(`/packages/${id}`); load(); } catch (e) { toast.error(fmtErr(e)); } };
  const edit = (p) => { setEditing(p.id); setForm({ ...p, inclusions: (p.inclusions || []).join(", "), offer_price: p.offer_price ?? "" }); setOpen(true); };

  return (
    <div>
      <PageHead
        title="Packages"
        subtitle={isAdmin ? "Birthday, party, group — sabhi packages" : "Available packages"}
        action={isAdmin && <Button data-testid="new-pkg-btn" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add Package</Button>}
      />

      {list.length === 0 ? (
        <EmptyState title="No packages yet" description={isAdmin ? "Birthday, group ya party packages banayen." : "Admin will add packages."} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
          {list.map((p) => (
            <Card key={p.id} className="p-6 rounded-2xl hover:shadow-md transition-shadow relative overflow-hidden" data-testid={`pkg-card-${p.id}`}>
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary/20" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center"><PartyPopper className="h-5 w-5" /></div>
                  <div>
                    <div className="font-black text-xl">{p.name}</div>
                    <div className="text-xs uppercase tracking-widest font-bold text-secondary">{p.type} · {p.pax} pax</div>
                  </div>
                </div>
                {p.description && <p className="text-sm text-muted-foreground mb-3">{p.description}</p>}
                {p.inclusions?.length > 0 && (
                  <ul className="text-sm space-y-1 mb-4">
                    {p.inclusions.map((inc, i) => <li key={i} className="flex gap-2"><span className="text-accent">•</span>{inc}</li>)}
                  </ul>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    {p.offer_price && p.offer_price < p.price ? (
                      <div>
                        <span className="text-3xl font-black text-accent">{inr(p.offer_price)}</span>
                        <span className="ml-2 text-sm line-through text-muted-foreground">{inr(p.price)}</span>
                      </div>
                    ) : <span className="text-3xl font-black">{inr(p.price)}</span>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button data-testid={`edit-pkg-${p.id}`} size="icon" variant="ghost" onClick={() => edit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button data-testid={`del-pkg-${p.id}`} size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing ? "Edit" : "New"} Package</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="pkg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="pkg-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Pax</Label><Input type="number" data-testid="pkg-pax" value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Price* ₹</Label><Input type="number" data-testid="pkg-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Offer Price ₹</Label><Input type="number" data-testid="pkg-offer" value={form.offer_price || ""} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></div>
            </div>
            <div><Label>Inclusions (comma separated)</Label><Textarea data-testid="pkg-incl" value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder="Cake, Decoration, Unlimited games..." /></div>
            <div><Label>Description</Label><Textarea data-testid="pkg-desc" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <Label htmlFor="pkg-active-switch">Active</Label>
              <Switch id="pkg-active-switch" data-testid="pkg-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="pkg-save" onClick={save} className="rounded-full bg-accent hover:bg-accent/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
