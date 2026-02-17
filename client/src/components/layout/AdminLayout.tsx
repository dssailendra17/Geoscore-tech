import { Link, useLocation } from "wouter";
import { Users, FileText, Crown, Shield, Settings as SettingsIcon, LayoutDashboard, ArrowLeft, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/brands", label: "Brands", icon: Users },
  { href: "/admin/plans", label: "Plans & Capabilities", icon: Crown },
  { href: "/admin/prompt-templates", label: "Prompt Templates", icon: FileText },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <aside className="w-64 bg-card border-r fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-xl">Admin Portal</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Geoscore Management</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}>
              <div 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors",
                  location === item.href ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/app/dashboard">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent cursor-pointer text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to App
            </div>
          </Link>
        </div>
      </aside>
      <main className="pl-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
