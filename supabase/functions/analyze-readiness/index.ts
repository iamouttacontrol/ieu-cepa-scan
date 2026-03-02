import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scanId } = await req.json();
    if (!scanId) throw new Error("scanId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch scan data
    const { data: scan, error: fetchError } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

    if (fetchError || !scan) throw new Error("Scan not found");

    // Build prompt for AI analysis
    const prompt = `You are an IEU-CEPA (Indonesia-EU Comprehensive Economic Partnership Agreement) trade compliance expert.

Analyze this Indonesian company's EU export readiness and provide a detailed assessment.

Company Profile:
- Name: ${scan.company_name || "Not provided"}
- Sector: ${scan.sector}
- Size: ${scan.company_size || "Not specified"}
- Region: ${scan.region}

Product & Market:
- Product: ${scan.product_type || "Not specified"}
- HS Code: ${scan.hs_code || "Not provided"}
- Target Country: ${scan.target_country}
- Export Experience: ${scan.export_experience || "Not specified"}

Current Compliance Status:
- Digital Product Passport: ${scan.compliance_dpp ? "Yes" : "No"}
- EUDR Due Diligence: ${scan.compliance_eudr ? "Yes" : "No"}
- CE Marking: ${scan.compliance_ce ? "Yes" : "No"}
- ESG/Sustainability Reporting: ${scan.compliance_esg ? "Yes" : "No"}
- Origin/Cumulation Documentation: ${scan.compliance_origin ? "Yes" : "No"}
- Food Safety Certifications: ${scan.compliance_food_safety ? "Yes" : "No"}

Respond using the suggest_readiness_assessment tool.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_readiness_assessment",
              description: "Return the IEU-CEPA readiness assessment results",
              parameters: {
                type: "object",
                properties: {
                  score: {
                    type: "integer",
                    description: "Readiness score from 0-100",
                  },
                  missing_requirements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  completed_requirements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  risk_level: {
                    type: "string",
                    enum: ["Low", "Medium", "High", "Critical"],
                  },
                  risk_description: { type: "string" },
                  action_plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        effort: { type: "string" },
                        priority: {
                          type: "string",
                          enum: ["High", "Medium", "Low"],
                        },
                      },
                      required: ["title", "description", "effort", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  "score",
                  "missing_requirements",
                  "completed_requirements",
                  "risk_level",
                  "risk_description",
                  "action_plan",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "suggest_readiness_assessment" },
        },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const assessment = JSON.parse(toolCall.function.arguments);

    // Update scan with results
    const { error: updateError } = await supabase
      .from("scans")
      .update({
        score: assessment.score,
        missing_requirements: assessment.missing_requirements,
        completed_requirements: assessment.completed_requirements,
        risk_level: assessment.risk_level,
        risk_description: assessment.risk_description,
        action_plan: assessment.action_plan,
        status: "completed",
      })
      .eq("id", scanId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, ...assessment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-readiness error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
