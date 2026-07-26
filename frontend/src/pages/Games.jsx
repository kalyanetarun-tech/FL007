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

const empty = { name: "", category: "Ride", price: 0, offer_price: null, duration_min: null, description: "", active: true };

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
    if (!window.confirm("Delete this game?")) return;
    try { await api.delete(`/games/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const edit = (g) => { setEditing(g.id); setForm({ ...g, offer_price: g.offer_price ?? "", duration_min: g.duration_min ?? "" }); setOpen(true); };

  return (
    <div>
      <PageHead
        title="Games & Rides"
        subtitle={isAdmin ? "Har game ka price aur offer manage karo" : "Games list (view only)"}
        action={isAdmin && <Button data-testid="new-game-btn" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add Game</Button>}
      />

      {list.length === 0 ? (
        <EmptyState title="No games added yet" description={isAdmin ? "Trampoline, VR, Bowling — jo bhi rides ho add karo." : "Admin needs to add games."} action={isAdmin && <Button data-testid="empty-add-game" onClick={() => setOpen(true)} className="rounded-full">Add first game</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {list.map((g) => (
            <Card key={g.id} className="p-5 rounded-2xl hover:shadow-md transition-shadow" data-testid={`game-card-${g.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center"><Gamepad2 className="h-5 w-5" /></div>
                  <div>
                    <div className="font-black text-lg leading-tight">{g.name}</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{g.category}</div>
                  </div>
                </div>
                {!g.active && <Badge variant="outline" className="rounded-full">Inactive</Badge>}
              </div>
              {g.description && <div className="text-sm text-muted-foreground mb-3">{g.description}</div>}
              <div className="flex items-end justify-between">
                <div>
                  {g.offer_price && g.offer_price < g.price ? (
                    <div>
                      <span className="text-2xl font-black text-accent">{inr(g.offer_price)}</span>
                      <span className="ml-2 text-sm line-through text-muted-foreground">{inr(g.price)}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-black">{inr(g.price)}</span>
                  )}
                  {g.duration_min && <div className="text-xs text-muted-foreground">{g.duration_min} min</div>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button data-testid={`edit-game-${g.id}`} size="icon" variant="ghost" onClick={() => edit(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button data-testid={`del-game-${g.id}`} size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing ? "Edit" : "New"} Game</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="game-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input data-testid="game-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Duration (min)</Label><Input type="number" data-testid="game-duration" value={form.duration_min || ""} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Price* ₹</Label><Input type="number" data-testid="game-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Offer Price ₹</Label><Input type="number" data-testid="game-offer" value={form.offer_price || ""} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea data-testid="game-desc" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
