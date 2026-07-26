import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Megaphone } from "lucide-react";

const ALL_PERMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "prebookings", label: "Prebookings" },
  { key: "inquiries", label: "Inquiries" },
  { key: "visit", label: "New Bill / Visit" },
  { key: "bills", label: "Bills" },
  { key: "customers", label: "Customers" },
  { key: "games", label: "Games / Activities" },
  { key: "packages", label: "Packages" },
  { key: "attendance", label: "Attendance" },
];
const DEFAULT_PERMS = ALL_PERMS.map((p) => p.key);

const empty = { name: "", email: "", phone: "", password: "", role: "employee", permissions: DEFAULT_PERMS, is_marketing_exec: false };

export default function Staff() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/users").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing && (!form.email || !form.password || !form.name)) return toast.error("Name, email, password required");
    try {
      if (editing) {
        const payload = { name: form.name, phone: form.phone, role: form.role, permissions: form.permissions, is_marketing_exec: form.is_marketing_exec };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editing}`, payload);
      } else {
        await api.post("/users", form);
      }
      toast.success("Saved"); setOpen(false); setForm(empty); setEditing(null); load();
    }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this staff?")) return;
    try { await api.delete(`/users/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const edit = (u) => {
    setEditing(u.id);
    setForm({
      name: u.name, email: u.email, phone: u.phone || "", password: "",
      role: u.role, permissions: u.permissions || DEFAULT_PERMS, is_marketing_exec: !!u.is_marketing_exec,
    });
    setOpen(true);
  };

  const togglePerm = (k) => setForm((f) => ({ ...f, permissions: f.permissions.includes(k) ? f.permissions.filter((x) => x !== k) : [...f.permissions, k] }));

  return (
    <div>
      <PageHead
        title="Staff"
        subtitle="Employee accounts, permissions aur marketing exec assign karo"
        action={<Button data-testid="new-staff-btn" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>}
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
              <div className="text-sm text-muted-foreground mb-3">{u.phone || "—"}</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(u.permissions || (u.role === "admin" ? ["all"] : [])).slice(0, 6).map((p) => (
                  <Badge key={p} variant="outline" className="rounded-full text-[10px] capitalize">{p}</Badge>
                ))}
                {(u.permissions || []).length > 6 && <Badge variant="outline" className="rounded-full text-[10px]">+{u.permissions.length - 6}</Badge>}
              </div>
              {u.is_marketing_exec && <Badge className="rounded-full bg-primary/20 text-accent border-primary mb-3"><Megaphone className="h-3 w-3 mr-1" /> Marketing Exec</Badge>}
              <div className="flex gap-2">
                <Button data-testid={`edit-staff-${u.id}`} onClick={() => edit(u)} size="sm" variant="outline" className="rounded-full"><Shield className="h-4 w-4 mr-1" /> Edit</Button>
                {u.role !== "admin" && <Button data-testid={`del-staff-${u.id}`} onClick={() => remove(u.id)} size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </Card>
          ))}
        </div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing ? "Edit" : "Add"} Staff</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email{!editing && "*"}</Label><Input data-testid="staff-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} /></div>
              <div><Label>Phone</Label><Input data-testid="staff-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Password{editing && " (leave blank to keep)"}{!editing && "*"}</Label><Input data-testid="staff-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="staff-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role !== "admin" && (
              <>
                <div>
                  <Label className="mb-2 block">Allowed Sections (kya-kya dikhega isko)</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl">
                    {ALL_PERMS.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          data-testid={`perm-${p.key}`}
                          checked={form.permissions.includes(p.key)}
                          onCheckedChange={() => togglePerm(p.key)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                  <div>
                    <Label htmlFor="mk-exec" className="font-bold">Marketing Executive</Label>
                    <div className="text-xs text-muted-foreground">Naye webhook inquiries auto-assign ho round-robin</div>
                  </div>
                  <Switch id="mk-exec" data-testid="staff-mkexec" checked={form.is_marketing_exec} onCheckedChange={(v) => setForm({ ...form, is_marketing_exec: v })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="staff-save" onClick={save} className="rounded-full bg-accent hover:bg-accent/90">{editing ? "Update" : "Add Staff"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
