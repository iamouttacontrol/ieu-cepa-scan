import {
  Play,
  ScanSearch,
  CheckSquare,
  MessageCircle,
  Globe,
  Bell,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
}

const notifications = [
  {
    id: 1,
    title: "EUDR Phase 2 Deadline Extended",
    desc: "The European Commission has extended the EUDR Phase 2 deadline to December 2026. Review your compliance timeline.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    title: "New Learning Module Available",
    desc: "\"Digital Product Passport for Palm Oil\" — a 5-min module tailored to your sector.",
    time: "1 day ago",
    unread: true,
  },
  {
    id: 3,
    title: "Readiness Score Updated",
    desc: "Your IEU-CEPA readiness score has been recalculated based on recent compliance changes.",
    time: "3 days ago",
    unread: false,
  },
];

const DashboardScreen = ({ onNavigate }: DashboardScreenProps) => {
  const [lang, setLang] = useState<"ID" | "EN">("ID");
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleLang = () => {
    const next = lang === "ID" ? "EN" : "ID";
    setLang(next);
    toast.success(`Language switched to ${next === "ID" ? "Bahasa Indonesia" : "English"}`);
  };

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang 👋</p>
          <h1 className="text-xl font-bold">PT Hijau Lestari</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "ID" ? "ID / EN" : "EN / ID"}
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative rounded-full border border-border p-2 transition-colors hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
          </button>
        </div>
      </div>

      {/* Readiness Progress */}
      <div className="wireframe-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">EU Readiness</span>
          <span className="text-2xl font-bold text-primary">65%</span>
        </div>
        <Progress value={65} className="h-3" />
        <p className="mt-2 text-xs text-muted-foreground">
          3 of 8 compliance areas completed
        </p>
      </div>

      {/* Notification Banner */}
      <button
        onClick={() => setShowNotifications(true)}
        className="wireframe-card border-l-4 border-l-warning w-full text-left"
      >
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold">New EU Regulation Update</p>
            <p className="text-xs text-muted-foreground">
              EUDR Phase 2 deadline extended — see what it means for your sector
            </p>
          </div>
        </div>
      </button>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="quick-action-btn" onClick={() => onNavigate("learning")}>
            <Play className="h-6 w-6 text-primary" />
            <span>Start 3-Min Learning</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate("scan")}>
            <ScanSearch className="h-6 w-6 text-primary" />
            <span>Run AI Readiness Scan</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate("scan")}>
            <CheckSquare className="h-6 w-6 text-secondary" />
            <span>Continue My Checklist</span>
          </button>
          <button className="quick-action-btn" onClick={() => onNavigate("community")}>
            <MessageCircle className="h-6 w-6 text-secondary" />
            <span>Ask an Expert</span>
          </button>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="trust-badge">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified Content · University Partner
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </h3>
              <button onClick={() => setShowNotifications(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="divide-y divide-border overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-4 ${n.unread ? "bg-accent/30" : ""}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.desc}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;
