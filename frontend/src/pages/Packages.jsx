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
import { Plus, Pencil, Trash2, PartyPopper, X as XIcon } from "lucide-react";

// GST rate reference (must match backend GST_RATE_BY_CATEGORY)
const CAT_OPTIONS = [
  { v: "activity",    label: "Activity / Games",   rate: 18 },
  { v: "food",        label: "Food / F&B",          rate: 5 },
  { v: "room",        label: "Room / Stay",         rate: 12 },
  { v: "clothing",    label: "Clothing",            rate: 12 },
  { v: "merchandise", label: "Merchandise",         rate: 18 },
  { v: "other",       label: "Other",               rate: 18 },
];
const rateFor = (cat) => (CAT_OPTIONS.find((c) => c.v === cat) || CAT_OPTIONS[0]).rate;

const empty = { name: "", type: "birthday", category: "", price: 0, offer_price: null, pax: 10, inclusions: "", description: "", active: true, gst_split: [] };

export default function Packages() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);       // items from /api/games to pick into gst_split
  const [pickerOpen, setPickerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => api.get("/packages").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); api.get("/games").then((r) => setItems(r.data.filter((g) => g.active))).catch(() => {}); }, []);

  // Collect unique categories from the list
  const categories = Array.from(new Set(list.map((p) => (p.category || "").trim()).filter(Boolean))).sort();
  const filtered = filter === "all" ? list : list.filter((p) => (p.category || "").trim() === filter);

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Name & price required");
    const inclusions = typeof form.inclusions === "string" ? form.inclusions.split(",").map((s) => s.trim()).filter(Boolean) : form.inclusions;
    const price = +form.price;
    const gst_split = (form.gst_split || [])
      .map((s) => ({ label: (s.label || "").trim(), category: s.category || "activity", amount: +s.amount || 0 }))
      .filter((s) => s.amount > 0 && s.label);
    const splitSum = gst_split.reduce((s, r) => s + r.amount, 0);
    if (gst_split.length > 0 && Math.abs(splitSum - price) > 0.5) {
      return toast.error(`Split sum ₹${splitSum} must equal Price ₹${price}`);
    }
    const payload = { ...form, inclusions, price, offer_price: form.offer_price ? +form.offer_price : null, pax: +form.pax || 1, gst_split, food_portion: 0, activity_portion: 0 };
    try {
      if (editing) await api.patch(`/packages/${editing}`, payload);
      else await api.post("/packages", payload);
      toast.success("Saved!"); setOpen(false); setForm(empty); setEditing(null); load();
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const remove = async (id) => { if (!window.confirm("Delete package?")) return; try { await api.delete(`/packages/${id}`); load(); } catch (e) { toast.error(fmtErr(e)); } };
  const edit = (p) => {
    // Migrate legacy food_portion + activity_portion into gst_split if needed
    let gst_split = Array.isArray(p.gst_split) ? p.gst_split : [];
    if (gst_split.length === 0 && ((p.food_portion || 0) + (p.activity_portion || 0) > 0)) {
      gst_split = [];
      if (p.food_portion > 0) gst_split.push({ label: "Food", category: "food", amount: p.food_portion });
      if (p.activity_portion > 0) gst_split.push({ label: "Activity", category: "activity", amount: p.activity_portion });
    }
    setEditing(p.id);
    setForm({ ...p, inclusions: (p.inclusions || []).join(", "), offer_price: p.offer_price ?? "", gst_split });
    setOpen(true);
  };
  const addSplitRow = () => setForm((f) => ({ ...f, gst_split: [...(f.gst_split || []), { label: "", category: "activity", amount: 0 }] }));
  // Map item categories from Items page (entry/food/activities/dress/others) → backend GST category
  const ITEM_TO_GST = { entry: "activity", food: "food", activities: "activity", dress: "clothing", others: "other" };
  const addItemToSplit = (item) => {
    const gcat = ITEM_TO_GST[(item.category || "").toLowerCase()] || item.gst_category || "activity";
    const price = +item.offer_price || +item.price || 0;
    setForm((f) => ({
      ...f,
      gst_split: [...(f.gst_split || []), { label: item.name, category: gcat, amount: price, item_ref_id: item.id }],
    }));
    toast.success(`Added ${item.name}`);
  };
  const updateSplitRow = (i, patch) => setForm((f) => ({ ...f, gst_split: (f.gst_split || []).map((r, idx) => idx === i ? { ...r, ...patch } : r) }));
  const removeSplitRow = (i) => setForm((f) => ({ ...f, gst_split: (f.gst_split || []).filter((_, idx) => idx !== i) }));
  const autoFillFromInclusions = () => {
    // Split the price equally across current gst_split lines that have empty amount, or across all if empty
    let rows = form.gst_split || [];
    if (rows.length === 0) {
      const items = (typeof form.inclusions === "string" ? form.inclusions.split(",") : form.inclusions || []).map((s) => s.trim()).filter(Boolean);
      rows = items.slice(0, 6).map((label) => ({ label, category: "activity", amount: 0 }));
    }
    if (rows.length === 0) return toast.error("Add inclusions or add a row first");
    const per = Math.floor((+form.price || 0) / rows.length);
    const remainder = (+form.price || 0) - per * rows.length;
    const next = rows.map((r, i) => ({ ...r, amount: per + (i === 0 ? remainder : 0) }));
    setForm((f) => ({ ...f, gst_split: next }));
  };

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
                        {(() => {
                          // Prefer new gst_split, fall back to legacy portions
                          let split = Array.isArray(p.gst_split) && p.gst_split.length ? p.gst_split : [];
                          if (split.length === 0 && ((p.food_portion || 0) + (p.activity_portion || 0) > 0)) {
                            split = [];
                            if (p.food_portion > 0) split.push({ category: "food", amount: p.food_portion });
                            if (p.activity_portion > 0) split.push({ category: "activity", amount: p.activity_portion });
                          }
                          if (split.length === 0) return null;
                          return (
                            <div className="text-[10px] uppercase tracking-widest font-black text-foreground/60 mt-1 space-y-0.5">
                              {split.map((s, i) => (
                                <div key={i}>· {s.label || s.category} ₹{s.amount} @{rateFor(s.category)}%</div>
                              ))}
                            </div>
                          );
                        })()}
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
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3" data-testid="pkg-gst-split-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs uppercase tracking-widest font-black">GST Split (invoice pe alag-alag lines)</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="h-8 text-xs" data-testid="pkg-pick-items-btn">📦 Pick from Items</Button>
                  <Button type="button" size="sm" variant="outline" onClick={autoFillFromInclusions} className="h-8 text-xs" data-testid="pkg-autofill-btn">Auto-fill</Button>
                  <Button type="button" size="sm" onClick={addSplitRow} className="h-8 text-xs bg-accent hover:bg-accent/90" data-testid="pkg-add-split-btn"><Plus className="h-3 w-3 mr-1" /> Blank line</Button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Har line pe alag GST auto lagegi — Food 5%, Activity/Games 18%, Room 12%, Clothing 12%. Invoice ek hi banega but har chiz alag column me GST breakup ke saath aayegi. Empty rakhoge to poora price 18% activity ho jayega.
              </div>
              {(form.gst_split || []).length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-2">Koi split nahi. "Add line" pe click karo (e.g. Games ₹1200, Food ₹800).</div>
              ) : (
                <div className="space-y-2">
                  {(form.gst_split || []).map((row, i) => {
                    const rate = rateFor(row.category);
                    return (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center" data-testid={`pkg-split-row-${i}`}>
                        <div className="col-span-4">
                          <Input data-testid={`pkg-split-label-${i}`} placeholder="Label (e.g. Games)" value={row.label} onChange={(e) => updateSplitRow(i, { label: e.target.value })} className="h-9 text-sm" />
                        </div>
                        <div className="col-span-4">
                          <select
                            data-testid={`pkg-split-cat-${i}`}
                            value={row.category}
                            onChange={(e) => updateSplitRow(i, { category: e.target.value })}
                            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            {CAT_OPTIONS.map((c) => <option key={c.v} value={c.v}>{c.label} ({c.rate}%)</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Input data-testid={`pkg-split-amt-${i}`} type="number" placeholder="₹" value={row.amount || ""} onChange={(e) => updateSplitRow(i, { amount: e.target.value })} className="h-9 text-sm" />
                        </div>
                        <button type="button" onClick={() => removeSplitRow(i)} className="col-span-1 h-9 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center" data-testid={`pkg-split-remove-${i}`}>
                          <XIcon className="h-4 w-4" />
                        </button>
                        <div className="col-span-12 -mt-1 text-[10px] text-muted-foreground pl-1">
                          GST @{rate}% on ₹{+row.amount || 0} = ₹{((+row.amount || 0) * rate / 100).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                  {(() => {
                    const sum = (form.gst_split || []).reduce((s, r) => s + (+r.amount || 0), 0);
                    const ok = Math.abs(sum - (+form.price || 0)) < 0.5;
                    return (
                      <div className={`text-xs font-black flex items-center justify-between p-2 rounded-lg ${ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`} data-testid="pkg-split-sum">
                        <span>Split sum: ₹{sum.toFixed(2)}</span>
                        <span>Package price: ₹{(+form.price || 0).toFixed(2)}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
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

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="pkg-picker-dialog">
          <DialogHeader><DialogTitle className="text-2xl font-black">Pick items to include</DialogTitle></DialogHeader>
          <div className="text-xs text-muted-foreground mb-3">Category se auto GST lag jayegi. Multiple items add kar sakte ho — price bhi baad me change kar sakte ho.</div>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Koi item nahi hai. Pehle <b>Items / Activities</b> page pe items banao.</div>
          ) : (
            <div className="space-y-4">
              {["entry", "food", "activities", "dress", "others"].map((cat) => {
                const rows = items.filter((i) => (i.category || "").toLowerCase() === cat);
                if (rows.length === 0) return null;
                return (
                  <div key={cat} data-testid={`pkg-picker-group-${cat}`}>
                    <div className="text-xs uppercase tracking-widest font-black text-secondary mb-2">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rows.map((it) => (
                        <button
                          key={it.id}
                          data-testid={`pkg-picker-item-${it.id}`}
                          type="button"
                          onClick={() => addItemToSplit(it)}
                          className="text-left p-3 rounded-xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold truncate">{it.name}</div>
                            <div className="text-[10px] uppercase text-muted-foreground tracking-widest">{cat}</div>
                          </div>
                          <div className="text-lg font-black text-accent tabular-nums">{inr(+it.offer_price || +it.price || 0)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <Button type="button" onClick={() => setPickerOpen(false)} data-testid="pkg-picker-done" className="w-full rounded-full bg-accent hover:bg-accent/90 font-black">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
