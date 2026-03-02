import { Upload, CheckCircle2, Loader2, ListChecks, Download, Play, Sparkles, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ActionItemData {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  completed: boolean;
  learningModule?: string;
}

const ActionPlanScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"generate" | "plan">("generate");
  const [uploadedReport, setUploadedReport] = useState<{ name: string; path: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [actionItems, setActionItems] = useState<ActionItemData[]>([
    { id: "1", title: "Complete EUDR Due Diligence Documentation", description: "Prepare and submit deforestation-free supply chain verification documents", priority: "High", deadline: "Apr 15, 2026", completed: false, learningModule: "EUDR: Deforestation Compliance Basics" },
    { id: "2", title: "Obtain Digital Product Passport", description: "Register for EU Digital Product Passport and input product lifecycle data", priority: "High", deadline: "May 1, 2026", completed: true, learningModule: "What is the Digital Product Passport?" },
    { id: "3", title: "Prepare Sustainability Report", description: "Draft ESG disclosures following EU sustainability reporting standards", priority: "Medium", deadline: "May 15, 2026", completed: true },
    { id: "4", title: "Verify Origin Documentation", description: "Obtain proof of origin certificates for preferential tariff access", priority: "Medium", deadline: "Jun 1, 2026", completed: false, learningModule: "CE Marking: Step-by-Step Guide" },
    { id: "5", title: "Food Safety Certification Audit", description: "Schedule and complete HACCP or ISO 22000 audit with accredited body", priority: "Low", deadline: "Jun 30, 2026", completed: false },
  ]);

  const completedCount = actionItems.filter(i => i.completed).length;
  const totalCount = actionItems.length;
  const filtered = filter === "All" ? actionItems : actionItems.filter(i => i.priority === filter);

  const handleUploadReport = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const file = files[0];
    try {
      const filePath = `action-plans/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("scan-documents").upload(filePath, file);
      if (error) throw error;
      setUploadedReport({ name: file.name, path: filePath });
      toast.success("Report uploaded successfully");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate AI generation
    await new Promise(r => setTimeout(r, 3000));
    setGenerating(false);
    setGenerated(true);
    toast.success("Action plan generated successfully!");
  };

  const toggleItem = (id: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const getPriorityClass = (p: string) => {
    if (p === "High") return "priority-high";
    if (p === "Medium") return "priority-medium";
    return "priority-low";
  };

  return (
    <div className="space-y-5 p-4 pb-8">
      <h1 className="text-xl font-bold">Action Plan</h1>

      {/* Tab Switcher */}
      <div className="flex rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${activeTab === "generate" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          Generate Plan
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${activeTab === "plan" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          View Action Plan
        </button>
      </div>

      {/* GENERATE TAB */}
      {activeTab === "generate" && !generating && !generated && (
        <div className="space-y-4">
          <div className="app-card-static space-y-2">
            <h2 className="text-base font-semibold">Generate Your Action Plan</h2>
            <p className="text-sm text-muted-foreground">
              Upload your readiness scan report and our AI will create a prioritized, step-by-step compliance action plan tailored to your business.
            </p>
          </div>

          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleUploadReport(e.target.files)} />

          {!uploadedReport ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="app-card flex w-full items-center justify-center gap-3 border-2 border-dashed border-primary/30 py-6"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
              <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Readiness Scan Report"}</span>
            </button>
          ) : (
            <div className="app-card-static flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">{uploadedReport.name}</p>
                <p className="text-xs text-muted-foreground">Ready for AI analysis</p>
              </div>
            </div>
          )}

          {uploadedReport && (
            <button
              onClick={handleGenerate}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Generate Action Plan with AI
            </button>
          )}
        </div>
      )}

      {activeTab === "generate" && generating && (
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-base font-bold text-center">Generating your action plan…</h2>
          <p className="text-sm text-muted-foreground text-center">AI is analyzing your report and creating prioritized steps</p>
        </div>
      )}

      {activeTab === "generate" && generated && (
        <div className="space-y-4">
          <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
            <h2 className="text-base font-bold">Action Plan Generated!</h2>
            <p className="text-sm text-muted-foreground mt-1">Your personalized compliance action plan is ready.</p>
          </div>
          <button
            onClick={() => setActiveTab("plan")}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2"
          >
            View Your Action Plan <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW ACTION PLAN TAB */}
      {activeTab === "plan" && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="app-card-static space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="font-bold text-primary">{completedCount}/{totalCount} completed</span>
            </div>
            <Progress value={(completedCount / totalCount) * 100} className="h-2.5" />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(["All", "High", "Medium", "Low"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {f}{f !== "All" ? " Priority" : ""}
              </button>
            ))}
          </div>

          {/* Action Items */}
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className={`app-card-static space-y-2 ${item.completed ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${item.completed ? "border-success bg-success" : "border-border"}`}
                  >
                    {item.completed && <CheckCircle2 className="h-3.5 w-3.5 text-success-foreground" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${item.completed ? "line-through" : ""}`}>{item.title}</p>
                      <span className={getPriorityClass(item.priority)}>{item.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Deadline: {item.deadline}</p>
                  </div>
                </div>
                {!item.completed && item.learningModule && (
                  <button
                    onClick={() => navigate("/learning")}
                    className="flex w-full items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs font-medium text-primary"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Watch: {item.learningModule}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={() => {
              const text = actionItems.map((i, idx) => `${idx + 1}. [${i.completed ? "✓" : " "}] ${i.title} (${i.priority}) - ${i.deadline}\n   ${i.description}`).join("\n\n");
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "action-plan.txt"; a.click();
              URL.revokeObjectURL(url);
              toast.success("Action plan exported!");
            }}
            className="w-full rounded-lg border border-input py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" /> Export Action Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionPlanScreen;
