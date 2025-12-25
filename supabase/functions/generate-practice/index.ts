import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PracticeRequest {
  sloName: string;
  masteryPercentage: number;
  questionCount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sloName, masteryPercentage, questionCount = 5 }: PracticeRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine difficulty based on mastery
    let difficulty: string;
    let contentType: string;
    
    if (masteryPercentage >= 85) {
      difficulty = "advanced";
      contentType = "Challenge Mode - critical thinking and application questions";
    } else if (masteryPercentage >= 60) {
      difficulty = "intermediate";
      contentType = "Reinforcement - standard practice questions";
    } else {
      difficulty = "beginner";
      contentType = "Foundational - step-by-step guided questions with detailed explanations";
    }

    const systemPrompt = `You are an educational AI tutor specializing in creating personalized practice materials. 
Your responses must be in valid JSON format only, with no additional text.
Create questions that are age-appropriate for school students and aligned with learning outcomes.`;

    const userPrompt = `The student has a ${masteryPercentage}% mastery in "${sloName}". 
Generate ${questionCount} ${difficulty}-level multiple-choice questions with immediate explanatory feedback for wrong answers.

Return ONLY a valid JSON object in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Explanation for the correct answer",
      "wrongAnswerFeedback": {
        "B": "Why B is wrong and hint to correct answer",
        "C": "Why C is wrong and hint to correct answer",
        "D": "Why D is wrong and hint to correct answer"
      },
      "difficulty": "${difficulty}",
      "estimatedTime": "2 min"
    }
  ],
  "contentType": "${contentType}",
  "totalEstimatedTime": "10 min"
}`;

    console.log(`Generating ${questionCount} ${difficulty} questions for SLO: ${sloName}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON response
    let parsedContent;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-practice function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
