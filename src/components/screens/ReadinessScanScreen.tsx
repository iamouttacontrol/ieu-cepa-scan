import { Upload, ChevronRight, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

const ReadinessScanScreen = () => {
  const [showResults, setShowResults] = useState(false);

  if (showResults) {
    return (
      <div className="space-y-5 p-4">
        <button onClick={() => setShowResults(false)} className="text-sm text-primary font-medium">
          ← Back to Scan
        </button>

        <h1 className="text-xl font-bold">Readiness Results</h1>

        {/* Score Circle */}
        <div className="wireframe-card flex flex-col items-center py-8">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-primary/20">
            <div className="absolute inset-1 flex items-center justify-center rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rotate-45" />
            <span className="text-3xl font-bold text-primary">72%</span>
          </div>
          <p className="mt-3 text-sm font-medium">EU Readiness Score</p>
        </div>

        {/* Missing Requirements */}
        <div className="wireframe-card space-y-3">
          <h3 className="text-sm font-semibold">Missing Requirements</h3>
          {["Digital Product Passport", "EUDR Due Diligence Report", "CE Marking Documentation"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Completed */}
        <div className="wireframe-card space-y-3">
          <h3 className="text-sm font-semibold">Completed</h3>
          {["Business Registration", "Product Classification"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Risk Indicators */}
        <div className="wireframe-card border-l-4 border-l-destructive">
          <p className="text-sm font-semibold">Risk: High</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sustainability documentation missing — may delay export approval
          </p>
        </div>

        <button className="w-full rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground">
          Generate Action Plan
        </button>

        <div className="flex justify-center">
          <div className="trust-badge">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI-assisted · Human-validated framework
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold">Readiness Scan</h1>
      <p className="text-sm text-muted-foreground">
        Answer a few questions to check your EU export readiness.
      </p>

      {/* Form */}
      <div className="wireframe-card space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Sector</label>
          <select className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option>Agriculture & Food</option>
            <option>Textiles & Garments</option>
            <option>Furniture & Wood</option>
            <option>Electronics</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Product Type</label>
          <input
            type="text"
            placeholder="e.g., Palm Oil, Coffee Beans"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Target EU Country</label>
          <select className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option>Germany</option>
            <option>Netherlands</option>
            <option>France</option>
            <option>Italy</option>
            <option>Spain</option>
          </select>
        </div>
      </div>

      {/* Upload */}
      <div className="wireframe-card">
        <label className="mb-1.5 block text-sm font-medium">Upload Documents (optional)</label>
        <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Tap to upload or drag files</p>
          <p className="text-xs text-muted-foreground">PDF, DOC, images up to 10MB</p>
        </div>
      </div>

      <button
        onClick={() => setShowResults(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
      >
        Run AI Analysis
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="flex justify-center">
        <div className="trust-badge">
          <ShieldCheck className="h-3.5 w-3.5" />
          AI-assisted · Human-validated framework
        </div>
      </div>
    </div>
  );
};

export default ReadinessScanScreen;
