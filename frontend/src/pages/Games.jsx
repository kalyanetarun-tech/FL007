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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Gamepad2 } from "lucide-react";

const ITEM_CATEGORIES = [
  { v: "entry",       label: "Entry / Ticket",       gst: "activity" },
  { v: "food",        label: "Food & Beverage",       gst: "food" },
  { v: "activities",  label: "Activities / Games",    gst: "activity" },
  { v: "dress",       label: "Dress / Clothing",      gst: "clothing" },
  { v: "others",      label: "Others",                gst: "other" },
];
const gstFor = (cat) => (ITEM_CATEGORIES.find((c) => c.v === cat) || ITEM_CATEGORIES[0]).gst;

const empty = { name: "", category: "activities", price: 0, offer_price: null, duration_min: null, description: "", active: true, gst_category: "activity", hsn_code: "" };

export default function Games() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/games").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Name & price required");
    try {
      const payload = { ...form, price: +form.price, offer_price: form.offer_price ? +form.offer_price : null, duration_min: form.duration_min ? +form.duration_min : null };
      if (editing) await api.patch(`/games/${editing}`, payload);
      else await api.post("/games", payload);
      toast.success("Saved!");
      setOpen(false); setForm(empty); setEditing(null); load();
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    try { await api.delete(`/games/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const FUNLAND_DEFAULTS = [
    { name: "Bungy Jumping", category: "Adventure", price: 200, description: "" },
    { name: "Bull Ride", category: "Adventure", price: 150 },
    { name: "Segway", category: "Ride", price: 100 },
    { name: "Shooting", category: "Games", price: 200 },
    { name: "ATV Ride", category: "Adventure", price: 220 },
    { name: "Buggy Ride", category: "Ride", price: 150 },
    { name: "Water Roller", category: "Water", price: 150 },
    { name: "Horse Riding", category: "Ride", price: 100 },
    { name: "Paddle Boat", category: "Water", price: 100 },
    { name: "Motor Boating", category: "Water", price: 150 },
    { name: "Sky Cycle", category: "Adventure", price: 200 },
    { name: "Water Zorbing", category: "Water", price: 150 },
  ];
  const seedFunland = async () => {
    if (!window.confirm(`${FUNLAND_DEFAULTS.length} default Funland activities add karne hain?`)) return;
    let ok = 0, fail = 0;
    for (const g of FUNLAND_DEFAULTS) {
      try { await api.post("/games", { ...g, active: true, offer_price: null }); ok++; }
      catch { fail++; }
    }
    toast.success(`Added ${ok} activities${fail ? `, ${fail} failed` : ""}`);
    load();
  };

  const edit = (g) => { setEditing(g.id); setForm({ ...g, offer_price: g.offer_price ?? "", duration_min: g.duration_min ?? "" }); setOpen(true); };

  return (
    <div>
      <PageHead
        title="Items / Activities"
        subtitle={isAdmin ? "Food, rooms, activities, games — sab yahin manage karo" : "Items / activities list (view only)"}
        action={isAdmin && (
          <div className="flex gap-2">
            {list.length === 0 && <Button data-testid="seed-games-btn" onClick={seedFunland} className="rounded-full bg-secondary hover:bg-secondary/90 h-11 px-5 font-bold text-secondary-foreground">Load Funland defaults</Button>}
            <Button data-testid="new-game-btn" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        )}
      />

      {list.length === 0 ? (
        <EmptyState title="No games added yet" description={isAdmin ? "Trampoline, VR, Bowling — jo bhi rides ho add karo." : "Admin needs to add games."} action={isAdmin && <Button data-testid="empty-add-game" onClick={() => setOpen(true)} className="rounded-full">Add first game</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {list.map((g) => {
            const themes = {
              "entry":         { bg: "from-blue-100 to-sky-100",       accent: "text-blue-700",    pill: "bg-blue-500 text-white" },
              "food":          { bg: "from-rose-100 to-pink-100",      accent: "text-rose-700",    pill: "bg-rose-500 text-white" },
              "activities":    { bg: "from-amber-100 to-yellow-100",   accent: "text-amber-700",   pill: "bg-amber-500 text-white" },
              "dress":         { bg: "from-violet-100 to-purple-100",  accent: "text-violet-700",  pill: "bg-violet-500 text-white" },
              "others":        { bg: "from-slate-100 to-gray-100",     accent: "text-slate-700",   pill: "bg-slate-500 text-white" },
              // Legacy support
              "Adventure": { bg: "from-orange-100 to-red-100", accent: "text-red-600", pill: "bg-red-500 text-white" },
              "Water": { bg: "from-cyan-100 to-blue-100", accent: "text-cyan-700", pill: "bg-cyan-500 text-white" },
              "Ride": { bg: "from-amber-100 to-yellow-100", accent: "text-amber-700", pill: "bg-amber-500 text-white" },
              "Games": { bg: "from-purple-100 to-fuchsia-100", accent: "text-fuchsia-700", pill: "bg-fuchsia-500 text-white" },
              "games": { bg: "from-purple-100 to-fuchsia-100", accent: "text-fuchsia-700", pill: "bg-fuchsia-500 text-white" },
              "rooms": { bg: "from-cyan-100 to-blue-100", accent: "text-cyan-700", pill: "bg-cyan-500 text-white" },
              "miscellaneous": { bg: "from-slate-100 to-gray-100", accent: "text-slate-700", pill: "bg-slate-500 text-white" },
              "merchandise": { bg: "from-indigo-100 to-purple-100", accent: "text-indigo-700", pill: "bg-indigo-500 text-white" },
              "other": { bg: "from-slate-100 to-gray-100", accent: "text-slate-700", pill: "bg-slate-500 text-white" },
            };
            const t = themes[g.category] || { bg: "from-emerald-100 to-teal-100", accent: "text-emerald-700", pill: "bg-emerald-500 text-white" };
            const catLabel = (ITEM_CATEGORIES.find((c) => c.v === g.category) || {}).label || g.category;
            return (
              <Card key={g.id} className={`p-5 rounded-2xl hover:shadow-lg transition-all relative overflow-hidden bg-gradient-to-br ${t.bg} border-0`} data-testid={`game-card-${g.id}`}>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/40" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${t.pill}`}>{catLabel}</span>
                    {!g.active && <Badge variant="outline" className="rounded-full bg-white/70">Inactive</Badge>}
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className={`h-5 w-5 ${t.accent}`} />
                      <div className="font-black text-xl leading-tight">{g.name}</div>
                    </div>
                    {g.description && <div className="text-xs text-foreground/70 mt-1">{g.description}</div>}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      {g.offer_price && g.offer_price < g.price ? (
                        <div>
                          <span className={`text-3xl font-black ${t.accent}`}>{inr(g.offer_price)}</span>
                          <span className="ml-2 text-xs line-through text-foreground/50">{inr(g.price)}</span>
                        </div>
                      ) : (
                        <span className={`text-3xl font-black ${t.accent}`}>{inr(g.price)}</span>
                      )}
                      {g.duration_min && <div className="text-[10px] uppercase tracking-widest font-bold text-foreground/60 mt-1">{g.duration_min} min</div>}
                      <div className="text-[10px] uppercase tracking-widest font-black text-foreground/60 mt-1">GST {g.gst_category === "food" ? "5%" : "18%"} · {g.gst_category || "activity"}</div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button data-testid={`edit-game-${g.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => edit(g)}><Pencil className="h-4 w-4" /></Button>
                        <Button data-testid={`del-game-${g.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing ? "Edit" : "New"} Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="game-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category*</Label>
                <select
                  data-testid="game-category"
                  value={form.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setForm({ ...form, category: cat, gst_category: gstFor(cat) });
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITEM_CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
                </select>
                <div className="text-[10px] text-muted-foreground mt-1">Aur category chahiye to "Other" ya "Miscellaneous" me daal do</div>
              </div>
              <div><Label>Duration (min)</Label><Input type="number" data-testid="game-duration" value={form.duration_min || ""} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Price* ₹</Label><Input type="number" data-testid="game-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Offer Price ₹</Label><Input type="number" data-testid="game-offer" value={form.offer_price || ""} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea data-testid="game-desc" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <div>
                <Label>GST Category*</Label>
                <select
                  data-testid="game-gst-cat"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.gst_category || "activity"}
                  onChange={(e) => setForm({ ...form, gst_category: e.target.value })}
                >
                  <option value="activity">Activity / Ride (18%)</option>
                  <option value="food">Food & Beverage (5%)</option>
                  <option value="room">Room / Stay (12%)</option>
                  <option value="clothing">Clothing (12%)</option>
                  <option value="merchandise">Merchandise (18%)</option>
                  <option value="goods">Goods (18%)</option>
                  <option value="other">Other (18%)</option>
                </select>
                <div className="text-[10px] text-muted-foreground mt-1">Internal record ke liye — customer bill par hide rehta hai</div>
              </div>
              <div>
                <Label>HSN / SAC code</Label>
                <Input data-testid="game-hsn" value={form.hsn_code || ""} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} placeholder="Auto — 999721 / 996331" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <Label htmlFor="game-active-switch">Active</Label>
              <Switch id="game-active-switch" data-testid="game-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="game-save" onClick={save} className="rounded-full bg-accent hover:bg-accent/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
