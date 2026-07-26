import React from "react";

export function PageHead({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2">Funland CRM</div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 text-sm md:text-base">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-white/50">
      <div className="text-lg font-bold mb-1">{title}</div>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {action}
    </div>
  );
}
