import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const empty = { name: "", email: "", phone: "", password: "", role: "employee" };

export default function Staff() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => api.get("/users").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.email || !form.password || !form.name) return toast.error("Name, email, password required");
    try { await api.post("/users", form); toast.success("Staff added"); setOpen(false); setForm(empty); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this staff?")) return;
    try { await api.delete(`/users/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  return (
    <div>
      <PageHead
        title="Staff"
        subtitle="Employee accounts manage karo"
        action={<Button data-testid="new-staff-btn" onClick={() => { setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>}
      />

      {list.length === 0 ? <EmptyState title="No staff yet" /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {list.map((u) => (
            <Card key={u.id} className="p-5 rounded-2xl" data-testid={`staff-card-${u.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-lg">{u.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="font-black">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
                <Badge className={`rounded-full ${u.role === "admin" ? "bg-accent text-accent-foreground" : "bg-secondary/20 text-secondary border-secondary"}`}>{u.role}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{u.phone || "—"}</div>
              {u.role !== "admin" && <Button data-testid={`del-staff-${u.id}`} onClick={() => remove(u.id)} size="sm" variant="ghost" className="mt-3 text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>}
            </Card>
          ))}
        </div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">Add Staff</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email*</Label><Input data-testid="staff-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input data-testid="staff-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Password*</Label><Input data-testid="staff-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="staff-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="staff-save" onClick={save} className="rounded-full bg-accent hover:bg-accent/90">Add Staff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
