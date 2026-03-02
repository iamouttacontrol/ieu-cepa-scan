

# IEU-CEPA Readiness Scanner -- Redesign Plan

## Overview
Redesign the Readiness Scan screen into a multi-step guided scanner flow that combines structured questionnaires with document uploads, culminating in a comprehensive results view with score, gap analysis, and action plan.

## New Flow (4 steps + Results)

```text
[Step 1: Company Profile]
        |
[Step 2: Product & Market]
        |
[Step 3: Compliance Status]
        |
[Step 4: Document Upload]
        |
[Analyzing... (loading)]
        |
[Results Dashboard]
  - Score
  - Gap Analysis
  - Action Plan
  - Download Report
```

## Step-by-step UI Design

### Step Navigation
- A progress bar at the top showing "Step 1 of 4", "Step 2 of 4", etc.
- Back/Next buttons at the bottom of each step
- Steps are tracked via state (currentStep number)

### Step 1 -- Company Profile
- Company name (text input)
- Sector (dropdown: Agriculture & Food, Textiles & Garments, Furniture & Wood, Electronics, Chemicals, Others)
- Company size (radio: Micro, Small, Medium)
- Province/Region in Indonesia (dropdown)

### Step 2 -- Product & Market
- Product type (text input, e.g., "Palm Oil, Coffee Beans")
- HS Code (optional text input with helper text explaining what it is)
- Target EU country (dropdown)
- Export experience (radio: First-time exporter, Have exported before, Currently exporting to EU)

### Step 3 -- Compliance Self-Assessment
A checklist of yes/no questions relevant to IEU-CEPA:
- "Do you have a Digital Product Passport?"
- "Do you have EUDR Due Diligence documentation?"
- "Do you have CE Marking (if applicable)?"
- "Do you have sustainability/ESG reporting?"
- "Have you completed origin/cumulation documentation?"
- "Do you have food safety certifications (if applicable)?"

Each item is a simple toggle/checkbox with a short explainer tooltip.

### Step 4 -- Document Upload
- Upload area for supporting documents (certificates, registrations, reports)
- List of suggested documents based on answers from Steps 1-3
- File upload zone with drag-and-drop
- List of uploaded files with remove option
- Note: "Documents help improve accuracy but are optional"

### Loading/Analysis Screen
- Brief animated state: "Analyzing your IEU-CEPA readiness..."
- Trust badge: "AI-assisted -- Human-validated framework"
- Auto-transitions to results after ~2 seconds (simulated)

### Results Dashboard
Comprehensive output with three sections:

**1. Readiness Score Card**
- Large circular score (e.g., 72%)
- Label: "IEU-CEPA Readiness Score"
- Color-coded: green (>75%), amber (50-75%), red (<50%)

**2. Gap Analysis**
- "Missing Requirements" list with warning icons
- "Completed" list with check icons
- "Risk Indicators" card with severity level and description
- Each gap item shows a brief explanation of why it matters

**3. Action Plan**
- Prioritized list of action items (numbered)
- Each item: title, description, estimated effort (e.g., "~2 weeks"), and priority tag (High/Medium/Low)
- "Download Full Report (PDF)" button (placeholder)
- "Share with Consultant" button (placeholder)

Back button returns to Step 1 (restart scan).

## Technical Approach

### File Changes
**Modified:** `src/components/screens/ReadinessScanScreen.tsx`
- Rewrite as a multi-step form using React state (`currentStep`, form data object, uploaded files list)
- No external form library needed for this wireframe -- simple useState management
- Each step is a conditional render based on `currentStep`

### No new files or dependencies needed
- Uses existing UI patterns (wireframe-card, trust-badge, Progress component)
- All within the single ReadinessScanScreen component (or split into sub-components within the same file for clarity)

### Data Structure (local state)
```text
scanData = {
  companyName, sector, companySize, region,
  productType, hsCode, targetCountry, exportExperience,
  complianceChecks: { dpp: bool, eudr: bool, ce: bool, ... },
  uploadedFiles: []
}
```

Results are hardcoded/mock data for this wireframe phase -- the score and gaps will be static but realistic examples.

