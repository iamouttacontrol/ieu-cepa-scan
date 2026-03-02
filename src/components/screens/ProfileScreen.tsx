import { User, Building2, MapPin, Factory, CheckCircle2, Globe, Bell, HelpCircle, Shield, LogOut, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ProfileScreen = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold">My Profile</h1>

      {/* Profile Card */}
      <div className="app-card-static flex flex-col items-center py-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-3 text-base font-bold">PT Nusantara Exports</h2>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> Jakarta, Indonesia
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Factory className="h-3 w-3" /> Textile Manufacturing
        </div>
        <button
          onClick={() => toast.info("Profile editing coming soon!")}
          className="mt-3 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary"
        >
          Edit Profile
        </button>
      </div>

      {/* Subscription */}
      <div className="app-card-static space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Current Plan</h3>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Starter</span>
        </div>
        <p className="text-lg font-bold">Rp 299,000<span className="text-sm font-normal text-muted-foreground">/month</span></p>
        <div className="space-y-2">
          {[
            "Unlimited readiness scans",
            "AI action plan generator",
            "Full microlearning library access",
            "Email support",
            "Community hub access (coming soon)",
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
          Upgrade to Pro
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Scans Completed", value: "3" },
          { label: "Action Items", value: "5" },
          { label: "Learning Progress", value: "33%" },
        ].map((stat, i) => (
          <div key={i} className="app-card-static text-center py-3">
            <p className="text-lg font-bold text-primary">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="space-y-1">
        {[
          { icon: Globe, label: "Language", value: "Bahasa Indonesia" },
          { icon: Bell, label: "Notifications", value: "Enabled" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={() => toast.info("Setting coming soon!")}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted transition-colors"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.value}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}

        <button
          onClick={() => toast.info("Help & Support coming soon!")}
          className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted transition-colors"
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <p className="flex-1 text-sm font-medium">Help & Support</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => toast.info("Privacy Policy coming soon!")}
          className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted transition-colors"
        >
          <Shield className="h-5 w-5 text-muted-foreground" />
          <p className="flex-1 text-sm font-medium">Privacy Policy</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-5 w-5 text-destructive" />
          <p className="flex-1 text-sm font-medium text-destructive">Logout</p>
        </button>
      </div>

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold">Logout</h3>
            <p className="mt-2 text-sm text-muted-foreground">Are you sure you want to logout?</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); toast.success("Logged out successfully"); }}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
