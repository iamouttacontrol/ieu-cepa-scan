import {
  Play,
  ScanSearch,
  CheckSquare,
  MessageCircle,
  Globe,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DashboardScreen = () => {
  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang 👋</p>
          <h1 className="text-xl font-bold">PT Hijau Lestari</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium">
            <Globe className="h-3.5 w-3.5" />
            ID / EN
          </button>
          <button className="relative rounded-full border border-border p-2">
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

      {/* Notification */}
      <div className="wireframe-card border-l-4 border-l-warning">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold">New EU Regulation Update</p>
            <p className="text-xs text-muted-foreground">
              EUDR Phase 2 deadline extended — see what it means for your sector
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="quick-action-btn">
            <Play className="h-6 w-6 text-primary" />
            <span>Start 3-Min Learning</span>
          </button>
          <button className="quick-action-btn">
            <ScanSearch className="h-6 w-6 text-primary" />
            <span>Run AI Readiness Scan</span>
          </button>
          <button className="quick-action-btn">
            <CheckSquare className="h-6 w-6 text-secondary" />
            <span>Continue My Checklist</span>
          </button>
          <button className="quick-action-btn">
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
    </div>
  );
};

export default DashboardScreen;
