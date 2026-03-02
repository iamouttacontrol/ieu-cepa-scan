import { Building2, FileText, BarChart3, CreditCard, Globe, Palette, ShieldCheck, ChevronRight, Clock, X } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const menuItems = [
  { icon: FileText, label: "Saved Documents", desc: "3 documents", detail: "Access your uploaded business registration, product certifications, and export licenses. Full document management is coming soon." },
  { icon: BarChart3, label: "Readiness Reports", desc: "2 reports", detail: "View your previous IEU-CEPA readiness scan reports. Report comparison and trend tracking are coming soon." },
  { icon: CreditCard, label: "Subscription Plan", desc: "Basic · Rp 150K/mo", detail: "You're on the Basic plan. Premium features including unlimited scans, priority expert access, and advanced analytics are coming soon." },
  { icon: Globe, label: "Language Preference", desc: "Bahasa Indonesia", detail: "Multi-language support with full Bahasa Indonesia and English localization is coming soon." },
  { icon: Palette, label: "Cultural Settings", desc: "Region: ID", detail: "Customize regional settings including date formats, currency display, and regulatory jurisdiction preferences. Coming soon." },
];

const ProfileScreen = () => {
  const [selectedItem, setSelectedItem] = useState<typeof menuItems[0] | null>(null);

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold">My Profile</h1>

      {/* Company Card */}
      <div className="wireframe-card flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold">PT Hijau Lestari</p>
          <p className="text-xs text-muted-foreground">Agriculture · Palm Oil · West Java</p>
        </div>
      </div>

      {/* Compliance Progress */}
      <div className="wireframe-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Compliance Progress</h3>
          <span className="text-sm font-bold text-primary">65%</span>
        </div>
        <Progress value={65} className="h-2.5" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-accent p-2.5 text-center">
            <p className="font-bold text-accent-foreground">3</p>
            <p className="text-muted-foreground">Completed</p>
          </div>
          <div className="rounded-lg bg-muted p-2.5 text-center">
            <p className="font-bold">5</p>
            <p className="text-muted-foreground">Remaining</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-1">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={() => setSelectedItem(item)}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted transition-colors"
            >
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Partner Logos */}
      <div className="wireframe-card text-center">
        <p className="text-xs font-medium text-muted-foreground mb-3">Institutional Partners</p>
        <div className="flex items-center justify-center gap-4">
          {["University A", "Trade Bureau", "EU Chamber"].map((p) => (
            <div key={p} className="flex h-10 items-center justify-center rounded border border-border px-3">
              <span className="text-xs text-muted-foreground">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification */}
      <div className="flex justify-center pb-4">
        <div className="trust-badge">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified SME · Certified Exporter
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50" onClick={() => setSelectedItem(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 mx-auto max-w-lg rounded-t-2xl bg-background p-6 shadow-xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <selectedItem.icon className="h-5 w-5 text-primary" />
                {selectedItem.label}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{selectedItem.desc}</p>
            <div className="flex items-start gap-3 rounded-lg bg-info/50 p-3">
              <Clock className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Coming Soon</p>
                <p className="text-xs text-muted-foreground">{selectedItem.detail}</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedItem(null); toast.success("You'll be notified when this feature launches!"); }}
              className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Notify Me When Available
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
