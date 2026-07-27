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

const empty = { name: "", type: "birthday", category: "", price: 0, offer_price: null, pax: 10, inclusions: "", description: "", active: true, food_portion: 0, activity_portion: 0, hsn_food: "996331", hsn_activity: "999721" };

export default function Packages() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => api.get("/packages").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  // Collect unique categories from the list
  const categories = Array.from(new Set(list.map((p) => (p.category || "").trim()).filter(Boolean))).sort();
  const filtered = filter === "all" ? list : list.filter((p) => (p.category || "").trim() === filter);

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Name & price required");
    const inclusions = typeof form.inclusions === "string" ? form.inclusions.split(",").map((s) => s.trim()).filter(Boolean) : form.inclusions;
    const fp = +form.food_portion || 0;
    const ap = +form.activity_portion || 0;
    const price = +form.price;
    if (fp + ap > 0 && Math.abs(fp + ap - price) > 0.5) {
      return toast.error(`Food (₹${fp}) + Activity (₹${ap}) = ₹${fp+ap} — should equal Price ₹${price}`);
    }
    const payload = { ...form, inclusions, price, offer_price: form.offer_price ? +form.offer_price : null, pax: +form.pax || 1, food_portion: fp, activity_portion: ap };
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
        <>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button data-testid="pkg-filter-all" onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${filter === "all" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>All ({list.length})</button>
              {categories.map((c) => (
                <button key={c} data-testid={`pkg-filter-${c}`} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${filter === c ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>{c} ({list.filter((p) => p.category === c).length})</button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
            {filtered.map((p) => {
              const themes = {
                birthday: { bg: "from-pink-100 via-rose-100 to-red-100", accent: "text-rose-600", pill: "bg-rose-500 text-white", icon: "🎂" },
                party: { bg: "from-yellow-100 via-amber-100 to-orange-100", accent: "text-orange-600", pill: "bg-orange-500 text-white", icon: "🎉" },
                group: { bg: "from-cyan-100 via-sky-100 to-blue-100", accent: "text-blue-600", pill: "bg-blue-500 text-white", icon: "👥" },
                other: { bg: "from-emerald-100 via-green-100 to-teal-100", accent: "text-emerald-600", pill: "bg-emerald-500 text-white", icon: "✨" },
              };
              const t = themes[p.type] || themes.other;
              return (
                <Card key={p.id} className={`p-6 rounded-2xl hover:shadow-lg transition-all relative overflow-hidden bg-gradient-to-br ${t.bg} border-0`} data-testid={`pkg-card-${p.id}`}>
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/30" />
                  <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-white/20" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center text-2xl shadow-sm">{t.icon}</div>
                        <div>
                          <div className="font-black text-2xl leading-tight" style={{ fontFamily: "Fraunces, serif" }}>{p.name}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-foreground/70">{p.type} · {p.pax} pax</div>
                        </div>
                      </div>
                      {p.category && <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${t.pill}`}>{p.category}</span>}
                    </div>
                    {p.description && <p className="text-sm text-foreground/80 mb-3">{p.description}</p>}
                    {p.inclusions?.length > 0 && (
                      <ul className="text-sm space-y-1 mb-4 bg-white/40 rounded-xl p-3 backdrop-blur">
                        {p.inclusions.map((inc, i) => <li key={i} className="flex gap-2"><span className={t.accent}>✓</span>{inc}</li>)}
                      </ul>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        {p.offer_price && p.offer_price < p.price ? (
                          <div>
                            <span className={`text-4xl font-black ${t.accent}`}>{inr(p.offer_price)}</span>
                            <span className="ml-2 text-sm line-through text-foreground/50">{inr(p.price)}</span>
                          </div>
                        ) : <span className={`text-4xl font-black ${t.accent}`}>{inr(p.price)}</span>}
                        {(p.food_portion > 0 || p.activity_portion > 0) && (
                          <div className="text-[10px] uppercase tracking-widest font-black text-foreground/60 mt-1">
                            GST: Food ₹{p.food_portion || 0} @5% · Activity ₹{p.activity_portion || 0} @18%
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button data-testid={`edit-pkg-${p.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => edit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button data-testid={`del-pkg-${p.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
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
            <div>
              <Label>Category (custom)</Label>
              <Input data-testid="pkg-category" list="pkg-cat-suggest" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Kids Special, Corporate, Weekend Combo" />
              <datalist id="pkg-cat-suggest">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <div className="text-xs text-muted-foreground mt-1">Same category use karke pakages group ho jayenge. Purani categories dropdown me suggest hongi.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Price* ₹</Label><Input type="number" data-testid="pkg-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Offer Price ₹</Label><Input type="number" data-testid="pkg-offer" value={form.offer_price || ""} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></div>
            </div>
            <div><Label>Inclusions (comma separated)</Label><Textarea data-testid="pkg-incl" value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder="Cake, Decoration, Unlimited games..." /></div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-widest font-black">GST split (Indian compliance)</Label>
                <span className="text-[10px] font-bold text-muted-foreground">Food 5% · Activity 18%</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Food portion ₹ (5% GST)</Label>
                  <Input type="number" data-testid="pkg-food-portion" value={form.food_portion || ""} onChange={(e) => setForm({ ...form, food_portion: e.target.value })} placeholder="e.g. 800" />
                </div>
                <div>
                  <Label>Activity portion ₹ (18% GST)</Label>
                  <Input type="number" data-testid="pkg-act-portion" value={form.activity_portion || ""} onChange={(e) => setForm({ ...form, activity_portion: e.target.value })} placeholder="e.g. 1200" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Food + Activity total = Package price. Blank rakhoge to full price 18% activity treat hoga.
                {(+form.food_portion || 0) + (+form.activity_portion || 0) > 0 && (
                  <span className={`ml-2 font-bold ${Math.abs((+form.food_portion || 0) + (+form.activity_portion || 0) - (+form.price || 0)) < 0.5 ? "text-emerald-600" : "text-destructive"}`}>
                    Sum: ₹{(+form.food_portion || 0) + (+form.activity_portion || 0)} / ₹{+form.price || 0}
                  </span>
                )}
              </div>
            </div>
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
