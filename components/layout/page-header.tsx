import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
        <Icon className="size-4.5" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
    </div>
  );
}
