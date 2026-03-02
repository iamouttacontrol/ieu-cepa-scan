import { Upload, ChevronRight, ChevronLeft, ShieldCheck, AlertTriangle, CheckCircle2, X, FileText, Download, Loader2, Info, ListChecks, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ScanData {
  companyName: string;
  sector: string;
  companySize: string;
  region: string;
  productType: string;
  hsCode: string;
  targetCountry: string;
  exportExperience: string;
  complianceChecks: {
    dpp: boolean;
    eudr: boolean;
    ce: boolean;
    esg: boolean;
    origin: boolean;
    foodSafety: boolean;
  };
  uploadedFiles: { name: string; path: string; size: number }[];
}

interface Requirement {
  name: string;
  description: string;
}

interface ActionItem {
  title: string;
  description: string;
  effort: string;
  priority: "High" | "Medium" | "Low";
}

interface ScanResults {
  score: number;
  missing_requirements: Requirement[];
  completed_requirements: Requirement[];
  risk_level: string;
  risk_description: string;
  action_plan: ActionItem[];
}

interface SavedReport {
  id: string;
  date: string;
  companyName: string;
  score: number;
  status: string;
}

const initialData: ScanData = {
  companyName: "",
  sector: "Agriculture & Food",
  companySize: "",
  region: "Jakarta",
  productType: "",
  hsCode: "",
  targetCountry: "Germany",
  exportExperience: "",
  complianceChecks: { dpp: false, eudr: false, ce: false, esg: false, origin: false, foodSafety: false },
  uploadedFiles: [],
};

const TOTAL_STEPS = 4;

const ReadinessScanScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"scan" | "reports">("scan");
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, 1-4 = steps
  const [data, setData] = useState<ScanData>(initialData);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progressPercent = currentStep > 0 ? (currentStep / TOTAL_STEPS) * 100 : 0;

  const loadReports = async () => {
    const { data: scans } = await supabase
      .from("scans")
      .select("id, created_at, company_name, score, status")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    if (scans) {
      setReports(scans.map(s => ({
        id: s.id,
        date: new Date(s.created_at).toLocaleDateString(),
        companyName: s.company_name,
        score: s.score ?? 0,
        status: s.status,
      })));
    }
  };

  const loadReportDetail = async (id: string) => {
    const { data: scan } = await supabase
      .from("scans")
      .select("*")
      .eq("id", id)
      .single();
    if (scan) setSelectedReport(scan);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      runAnalysis();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else setCurrentStep(0);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data: scan, error: insertError } = await supabase
        .from("scans")
        .insert({
          user_id: user!.id,
          company_name: data.companyName,
          sector: data.sector,
          company_size: data.companySize,
          region: data.region,
          product_type: data.productType,
          hs_code: data.hsCode,
          target_country: data.targetCountry,
          export_experience: data.exportExperience,
          compliance_dpp: data.complianceChecks.dpp,
          compliance_eudr: data.complianceChecks.eudr,
          compliance_ce: data.complianceChecks.ce,
          compliance_esg: data.complianceChecks.esg,
          compliance_origin: data.complianceChecks.origin,
          compliance_food_safety: data.complianceChecks.foodSafety,
          status: "analyzing",
        })
        .select()
        .single();

      if (insertError || !scan) throw insertError || new Error("Failed to create scan");

      const { data: analysisData, error: fnError } = await supabase.functions.invoke("analyze-readiness", {
        body: { scanId: scan.id },
      });

      if (fnError) throw fnError;
      if (analysisData?.error) throw new Error(analysisData.error);

      setResults({
        score: analysisData.score,
        missing_requirements: analysisData.missing_requirements,
        completed_requirements: analysisData.completed_requirements,
        risk_level: analysisData.risk_level,
        risk_description: analysisData.risk_description,
        action_plan: analysisData.action_plan,
      });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      toast.error(err?.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setData(initialData);
    setResults(null);
    setAnalyzing(false);
  };

  const updateField = (field: keyof ScanData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCompliance = (key: keyof ScanData["complianceChecks"]) => {
    setData((prev) => ({
      ...prev,
      complianceChecks: { ...prev.complianceChecks, [key]: !prev.complianceChecks[key] },
    }));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }
        const filePath = `uploads/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("scan-documents").upload(filePath, file);
        if (error) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        setData((prev) => ({
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, { name: file.name, path: filePath, size: file.size }],
        }));
        toast.success(`${file.name} uploaded`);
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = async (index: number) => {
    const file = data.uploadedFiles[index];
    if (file) await supabase.storage.from("scan-documents").remove([file.path]);
    setData((prev) => ({ ...prev, uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index) }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getScoreColor = (score: number) => score >= 75 ? "text-success" : score >= 50 ? "text-warning-foreground" : "text-destructive";
  const getScoreBorder = (score: number) => score >= 75 ? "border-success" : score >= 50 ? "border-warning" : "border-destructive";

  // --- ANALYZING SCREEN ---
  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 pt-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-lg font-bold text-center">Analyzing your readiness…</h2>
        <p className="text-sm text-muted-foreground text-center">Our AI is reviewing your compliance data against EU trade requirements</p>
        <div className="trust-badge">
          <Sparkles className="h-3.5 w-3.5" />
          AI-assisted · Human-validated framework
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (results) {
    const { score, missing_requirements, completed_requirements, risk_level, risk_description, action_plan } = results;
    return (
      <div className="space-y-5 p-4 pb-8">
        <button onClick={handleRestart} className="text-sm text-primary font-medium">← Back to Scan</button>
        <h1 className="text-xl font-bold">Readiness Report</h1>

        <div className="app-card-static flex flex-col items-center py-8">
          <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border-[6px] ${getScoreBorder(score)}/30`}>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
          </div>
          <p className="mt-3 text-sm font-medium">Overall Readiness Score</p>
        </div>

        {missing_requirements.length > 0 && (
          <div className="app-card-static space-y-3">
            <h3 className="text-sm font-semibold">Key Findings</h3>
            {missing_requirements.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                <div>
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {completed_requirements.length > 0 && (
          <div className="app-card-static space-y-3">
            <h3 className="text-sm font-semibold">Completed</h3>
            {completed_requirements.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" />
                <div>
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`app-card-static border-l-4 ${risk_level === "Critical" || risk_level === "High" ? "border-l-destructive" : risk_level === "Medium" ? "border-l-warning" : "border-l-success"}`}>
          <p className="text-sm font-semibold">Risk Level: {risk_level}</p>
          <p className="text-xs text-muted-foreground mt-1">{risk_description}</p>
        </div>

        {/* Info about Action Plan */}
        <div className="rounded-lg bg-success/10 border border-success/20 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-success shrink-0 mt-0.5" />
          <p className="text-xs text-success">Your report is now available for the Action Plan Generator.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/action-plan-generator")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            <ListChecks className="h-4 w-4" /> Generate Action Plan
          </button>
          <button
            onClick={() => {
              const reportText = `READINESS REPORT\n================\nCompany: ${data.companyName}\nScore: ${score}%\nRisk: ${risk_level}\n\nFindings:\n${missing_requirements.map(r => `- ${r.name}: ${r.description}`).join("\n")}\n\nCompleted:\n${completed_requirements.map(r => `- ${r.name}`).join("\n")}`;
              const blob = new Blob([reportText], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `Readiness-Report.txt`; a.click();
              URL.revokeObjectURL(url);
              toast.success("Report downloaded!");
            }}
            className="flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- REPORT DETAIL ---
  if (selectedReport) {
    const s = selectedReport;
    const score = s.score ?? 0;
    const missing = (s.missing_requirements as Requirement[]) || [];
    const completed = (s.completed_requirements as Requirement[]) || [];
    return (
      <div className="space-y-5 p-4 pb-8">
        <button onClick={() => setSelectedReport(null)} className="text-sm text-primary font-medium">← Back to Reports</button>
        <h1 className="text-xl font-bold">Report Details</h1>
        <div className="app-card-static flex flex-col items-center py-8">
          <div className={`flex h-28 w-28 items-center justify-center rounded-full border-[6px] ${getScoreBorder(score)}/30`}>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
          </div>
          <p className="mt-3 text-sm font-medium">Overall Score</p>
          <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
        </div>
        {missing.length > 0 && (
          <div className="app-card-static space-y-2">
            <h3 className="text-sm font-semibold">Key Findings</h3>
            {missing.map((r: Requirement, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        )}
        {completed.length > 0 && (
          <div className="app-card-static space-y-2">
            <h3 className="text-sm font-semibold">Completed</h3>
            {completed.map((r: Requirement, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate("/action-plan-generator")}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2"
        >
          <ListChecks className="h-4 w-4" /> Generate Action Plan from This Report
        </button>
      </div>
    );
  }

  // --- TABS ---
  return (
    <div className="space-y-5 p-4 pb-8">
      <h1 className="text-xl font-bold">Readiness Scan</h1>

      {/* Tab Switcher */}
      <div className="flex rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${activeTab === "scan" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          Start New Scan
        </button>
        <button
          onClick={() => { setActiveTab("reports"); loadReports(); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${activeTab === "reports" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          View Reports
        </button>
      </div>

      {/* SCAN TAB */}
      {activeTab === "scan" && currentStep === 0 && (
        <div className="space-y-4">
          <div className="app-card-static space-y-3">
            <h2 className="text-base font-semibold">5-Minute Quick Scan</h2>
            <p className="text-sm text-muted-foreground">
              Answer a few questions about your company and products. Our AI will assess your EU export compliance status and generate a detailed readiness report.
            </p>
          </div>
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2"
          >
            Start 5-Minute Quick Scan <ChevronRight className="h-4 w-4" />
          </button>
          <div className="rounded-lg bg-success/10 border border-success/20 p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <p className="text-xs text-success">After completing the scan, your report will be automatically available for the Action Plan Generator.</p>
          </div>
        </div>
      )}

      {activeTab === "scan" && currentStep > 0 && (
        <>
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep} of {TOTAL_STEPS}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Company Profile</h2>
              <div className="app-card-static space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Company Name</label>
                  <input type="text" value={data.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="PT. Your Company Name" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Sector</label>
                  <select value={data.sector} onChange={(e) => updateField("sector", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                    <option>Agriculture & Food</option><option>Textiles & Garments</option><option>Furniture & Wood</option><option>Electronics</option><option>Chemicals</option><option>Others</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Company Size</label>
                  <div className="flex gap-3">
                    {["Micro", "Small", "Medium"].map((size) => (
                      <button key={size} onClick={() => updateField("companySize", size)} className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${data.companySize === size ? "border-primary bg-primary/10 text-primary" : "border-input"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Province / Region</label>
                  <select value={data.region} onChange={(e) => updateField("region", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                    {["Jakarta", "West Java", "East Java", "Central Java", "North Sumatra", "South Sulawesi", "Bali", "East Kalimantan", "Other"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Product & Market</h2>
              <div className="app-card-static space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Product Type</label>
                  <input type="text" value={data.productType} onChange={(e) => updateField("productType", e.target.value)} placeholder="e.g., Palm Oil, Coffee Beans" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">HS Code <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <input type="text" value={data.hsCode} onChange={(e) => updateField("hsCode", e.target.value)} placeholder="e.g., 1511.10" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Target EU Country</label>
                  <select value={data.targetCountry} onChange={(e) => updateField("targetCountry", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                    {["Germany", "Netherlands", "France", "Italy", "Spain", "Belgium", "Poland"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Export Experience</label>
                  <div className="space-y-2">
                    {["First-time exporter", "Have exported before", "Currently exporting to EU"].map((exp) => (
                      <button key={exp} onClick={() => updateField("exportExperience", exp)} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${data.exportExperience === exp ? "border-primary bg-primary/10 text-primary" : "border-input"}`}>
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Compliance Self-Assessment</h2>
              <div className="app-card-static space-y-4">
                {([
                  { key: "dpp" as const, label: "Digital Product Passport", hint: "EU traceability requirement" },
                  { key: "eudr" as const, label: "EUDR Due Diligence", hint: "Deforestation-free verification" },
                  { key: "ce" as const, label: "CE Marking", hint: "Conformity marking for EU" },
                  { key: "esg" as const, label: "ESG Reporting", hint: "Environmental & social disclosures" },
                  { key: "origin" as const, label: "Origin Documentation", hint: "Proof of origin for preferential tariffs" },
                  { key: "foodSafety" as const, label: "Food Safety Certifications", hint: "HACCP, ISO 22000 or equivalent" },
                ]).map((item) => (
                  <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={data.complianceChecks[item.key]} onCheckedChange={() => toggleCompliance(item.key)} className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Document Upload</h2>
              <div className="app-card-static">
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                <div
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8 cursor-pointer transition-colors hover:border-primary hover:bg-accent/30"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
                >
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                  <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload or drag files"}</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, images up to 10MB</p>
                </div>
              </div>
              {data.uploadedFiles.length > 0 && (
                <div className="app-card-static space-y-2">
                  {data.uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-center text-muted-foreground">Documents are optional but improve accuracy</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleBack} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-input bg-background py-3 text-sm font-semibold">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={handleNext} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground">
              {currentStep === TOTAL_STEPS ? "Run AI Analysis" : "Next"} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="app-card-static text-center py-8">
              <p className="text-sm text-muted-foreground">No reports yet. Complete a scan to see your reports here.</p>
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="app-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{r.companyName || "Scan Report"}</p>
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(r.score)}`}>{r.score}%</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadReportDetail(r.id)} className="flex-1 rounded-lg border border-input py-2 text-xs font-medium">View Full Report</button>
                  <button onClick={() => navigate("/action-plan-generator")} className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground">Generate Action Plan</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ReadinessScanScreen;
