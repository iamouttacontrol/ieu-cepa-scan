import { Upload, ChevronRight, ChevronLeft, ShieldCheck, AlertTriangle, CheckCircle2, X, FileText, Download, Users, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
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
  uploadedFiles: string[];
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
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ScanData>(initialData);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      runAnalysis();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      // 1. Insert scan into database
      const { data: scan, error: insertError } = await supabase
        .from("scans")
        .insert({
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

      // 2. Call AI analysis edge function
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
    setCurrentStep(1);
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

  const addFile = (name: string) => {
    setData((prev) => ({ ...prev, uploadedFiles: [...prev.uploadedFiles, name] }));
  };

  const removeFile = (index: number) => {
    setData((prev) => ({ ...prev, uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index) }));
  };

  // --- ANALYZING SCREEN ---
  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 pt-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-lg font-bold text-center">Analyzing your IEU-CEPA readiness…</h2>
        <p className="text-sm text-muted-foreground text-center">Our AI is reviewing your compliance data against EU trade requirements</p>
        <div className="trust-badge">
          <ShieldCheck className="h-3.5 w-3.5" />
          AI-assisted · Human-validated framework
        </div>
      </div>
    );
  }

  // --- RESULTS DASHBOARD ---
  if (results) {
    const { score, missing_requirements, completed_requirements, risk_level, risk_description, action_plan } = results;
    const scoreColor = score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
    const scoreBorder = score >= 75 ? "border-success" : score >= 50 ? "border-warning" : "border-destructive";

    return (
      <div className="space-y-5 p-4 pb-8">
        <button onClick={handleRestart} className="text-sm text-primary font-medium">← Restart Scan</button>
        <h1 className="text-xl font-bold">IEU-CEPA Readiness Results</h1>

        {/* Score */}
        <div className="wireframe-card flex flex-col items-center py-8">
          <div className={`relative flex h-32 w-32 items-center justify-center rounded-full border-8 ${scoreBorder}/30`}>
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
          </div>
          <p className="mt-3 text-sm font-medium">IEU-CEPA Readiness Score</p>
          <p className="text-xs text-muted-foreground">AI-generated assessment based on your inputs</p>
        </div>

        {/* Missing Requirements */}
        {missing_requirements.length > 0 && (
          <div className="wireframe-card space-y-3">
            <h3 className="text-sm font-semibold">Missing Requirements</h3>
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

        {/* Completed */}
        {completed_requirements.length > 0 && (
          <div className="wireframe-card space-y-3">
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

        {/* Risk */}
        <div className={`wireframe-card border-l-4 ${risk_level === "Critical" || risk_level === "High" ? "border-l-destructive" : risk_level === "Medium" ? "border-l-warning" : "border-l-success"}`}>
          <p className="text-sm font-semibold">Risk Level: {risk_level}</p>
          <p className="text-xs text-muted-foreground mt-1">{risk_description}</p>
        </div>

        {/* Action Plan */}
        {action_plan.length > 0 && (
          <div className="wireframe-card space-y-4">
            <h3 className="text-sm font-semibold">Recommended Action Plan</h3>
            {action_plan.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{item.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.priority === "High" ? "bg-destructive/10 text-destructive" :
                      item.priority === "Medium" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>{item.priority}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Estimated effort: {item.effort}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground">
            <Download className="h-4 w-4" /> Download Report
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-input bg-background py-3 text-sm font-semibold">
            <Users className="h-4 w-4" /> Share with Consultant
          </button>
        </div>

        <div className="flex justify-center">
          <div className="trust-badge">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI-assisted · Human-validated framework
          </div>
        </div>
      </div>
    );
  }

  // --- STEP FORM ---
  return (
    <div className="space-y-5 p-4 pb-8">
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
          <h1 className="text-xl font-bold">Company Profile</h1>
          <p className="text-sm text-muted-foreground">Tell us about your company</p>
          <div className="wireframe-card space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Company Name</label>
              <input type="text" value={data.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="PT. Your Company Name" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sector</label>
              <select value={data.sector} onChange={(e) => updateField("sector", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                <option>Agriculture & Food</option>
                <option>Textiles & Garments</option>
                <option>Furniture & Wood</option>
                <option>Electronics</option>
                <option>Chemicals</option>
                <option>Others</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Company Size</label>
              <div className="flex gap-3">
                {["Micro", "Small", "Medium"].map((size) => (
                  <button key={size} onClick={() => updateField("companySize", size)} className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${data.companySize === size ? "border-primary bg-primary/10 text-primary" : "border-input bg-background"}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Province / Region</label>
              <select value={data.region} onChange={(e) => updateField("region", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                {["Jakarta", "West Java", "East Java", "Central Java", "North Sumatra", "South Sulawesi", "Bali", "East Kalimantan", "Other"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Product & Market</h1>
          <p className="text-sm text-muted-foreground">What are you exporting and where?</p>
          <div className="wireframe-card space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Product Type</label>
              <input type="text" value={data.productType} onChange={(e) => updateField("productType", e.target.value)} placeholder="e.g., Palm Oil, Coffee Beans" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">HS Code <span className="font-normal text-muted-foreground">(optional)</span></label>
              <input type="text" value={data.hsCode} onChange={(e) => updateField("hsCode", e.target.value)} placeholder="e.g., 1511.10" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              <p className="mt-1 text-xs text-muted-foreground">Harmonized System code for your product classification</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Target EU Country</label>
              <select value={data.targetCountry} onChange={(e) => updateField("targetCountry", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                {["Germany", "Netherlands", "France", "Italy", "Spain", "Belgium", "Poland"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Export Experience</label>
              <div className="space-y-2">
                {["First-time exporter", "Have exported before", "Currently exporting to EU"].map((exp) => (
                  <button key={exp} onClick={() => updateField("exportExperience", exp)} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${data.exportExperience === exp ? "border-primary bg-primary/10 text-primary" : "border-input bg-background"}`}>
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
          <h1 className="text-xl font-bold">Compliance Self-Assessment</h1>
          <p className="text-sm text-muted-foreground">Check which requirements you currently meet</p>
          <div className="wireframe-card space-y-4">
            {([
              { key: "dpp" as const, label: "Digital Product Passport", hint: "EU traceability requirement for product lifecycle data" },
              { key: "eudr" as const, label: "EUDR Due Diligence Documentation", hint: "Deforestation-free supply chain verification" },
              { key: "ce" as const, label: "CE Marking (if applicable)", hint: "Conformity marking for products sold in the EU" },
              { key: "esg" as const, label: "Sustainability / ESG Reporting", hint: "Environmental, social, and governance disclosures" },
              { key: "origin" as const, label: "Origin / Cumulation Documentation", hint: "Proof of origin for IEU-CEPA preferential tariffs" },
              { key: "foodSafety" as const, label: "Food Safety Certifications (if applicable)", hint: "HACCP, ISO 22000, or equivalent for food products" },
            ]).map((item) => (
              <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={data.complianceChecks[item.key]}
                  onCheckedChange={() => toggleCompliance(item.key)}
                  className="mt-0.5"
                />
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
          <h1 className="text-xl font-bold">Document Upload</h1>
          <p className="text-sm text-muted-foreground">Upload supporting documents to improve accuracy</p>

          <div className="wireframe-card space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Suggested documents:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Business registration certificate</li>
              <li>• Product certifications</li>
              <li>• Export licenses</li>
              <li>• Sustainability reports</li>
            </ul>
          </div>

          <div className="wireframe-card">
            <div
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8 cursor-pointer"
              onClick={() => addFile(`Document_${data.uploadedFiles.length + 1}.pdf`)}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tap to upload or drag files</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, images up to 10MB</p>
            </div>
          </div>

          {data.uploadedFiles.length > 0 && (
            <div className="wireframe-card space-y-2">
              <h3 className="text-sm font-semibold">Uploaded Files</h3>
              {data.uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {file}
                  </div>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">Documents help improve accuracy but are optional</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {currentStep > 1 && (
          <button onClick={handleBack} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-input bg-background py-3 text-sm font-semibold">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        <button onClick={handleNext} className={`flex items-center justify-center gap-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground ${currentStep > 1 ? "flex-1" : "w-full"}`}>
          {currentStep === TOTAL_STEPS ? "Run AI Analysis" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

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
