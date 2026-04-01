// src/services/ai-analysis.ts
// AI Brief Analyzer - Processes project briefs using LLM (OpenAI-compatible or Google Gemini)
import { prisma } from '@/lib/prisma';
import type { Brief, AIAnalysis, ProjectCategory } from '@prisma/client';

// LLM Provider configuration (supports multiple providers)
interface LLMResponse {
  features: string[];
  requirements: string[];
  category: ProjectCategory;
  techStack: string[];
  effortMinHours: number;
  effortMaxHours: number;
  complexityScore: number; // 1-5
  confidenceScore: number; // 0-1
}

const VALID_CATEGORIES: ProjectCategory[] = [
  'WEB_APP', 'MOBILE', 'AI_ML', 'AUTOMATION', 
  'INTEGRATION', 'ECOMMERCE', 'CMS', 'OTHER'
];

// Build the system prompt for the AI
function buildAnalysisPrompt(brief: Brief): string {
  return `You are an expert software project estimator and requirements analyst. 
Analyze the following project brief and provide a structured assessment.

PROJECT BRIEF:
Title: ${brief.title}
Description: ${brief.description}
Budget Range: ${brief.budgetRange}
Urgency: ${brief.urgency}

Provide your response as a valid JSON object with the following structure:
{
  "features": ["list of specific features/requirements extracted from the description"],
  "requirements": ["list of structured technical requirements needed"],
  "category": "one of: ${VALID_CATEGORIES.join(', ')}",
  "techStack": ["suggested technologies for this project"],
  "effortMinHours": minimum estimated hours (integer),
  "effortMaxHours": maximum estimated hours (integer),
  "complexityScore": number from 1-5 (1=simple landing page, 5=complex enterprise system),
  "confidenceScore": number from 0-1 (how confident you are in this analysis)
}

Rules:
- Features should be specific and actionable (e.g., "User authentication with email/password" not "Auth")
- Requirements should cover technical, security, and scalability needs
- Tech stack should be specific and modern
- Effort estimates should include development, testing, and deployment
- Complexity factors to consider: number of features, integrations required, real-time needs, data complexity
- Only return valid JSON, no additional text or markdown`;
}

// Build user message with the brief
function buildUserMessage(brief: Brief): string {
  return `Please analyze this project brief and provide a structured JSON assessment:\n\n${brief.description}`;
}

// Detect if we're using Google Gemini API
function isGeminiProvider(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY) || Boolean(process.env.LLM_BASE_URL?.includes('googleapis.com'));
}

// Call the LLM API (supports OpenAI-compatible APIs and Google Gemini)
async function callLLM(prompt: string, content: string): Promise<string> {
  const geminiKey = process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  
  if (!geminiKey && !openaiKey) {
    throw new Error('No API key configured. Set GOOGLE_API_KEY (Gemini), OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY');
  }

  // Use Gemini if GOOGLE_API_KEY is set
  if (geminiKey) {
    return callGemini(prompt, content, geminiKey);
  }

  // Fall back to OpenAI-compatible API
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const messageContent = data.choices?.[0]?.message?.content;
  
  if (!messageContent) {
    throw new Error('LLM returned empty response');
  }

  return messageContent;
}

// Call Google Gemini API
async function callGemini(prompt: string, content: string, apiKey: string): Promise<string> {
  const model = process.env.LLM_MODEL || 'gemini-2.0-flash';
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  // Combine system prompt + user content into single user message for Gemini
  const combinedContent = `${prompt}\n\n${content}`;
  
  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: combinedContent }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const messageContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!messageContent) {
    throw new Error('Gemini returned empty response');
  }

  return messageContent;
}

// Parse and validate the LLM response
function parseLLMResponse(rawResponse: string): LLMResponse {
  // Try to extract JSON from the response (handle markdown code blocks)
  let jsonStr = rawResponse.trim();
  
  // Remove markdown code blocks if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }
  
  // Find JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in LLM response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Validate and sanitize
  const result: LLMResponse = {
    features: Array.isArray(parsed.features) ? parsed.features.map(String) : [],
    requirements: Array.isArray(parsed.requirements) ? parsed.requirements.map(String) : [],
    category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'OTHER',
    techStack: Array.isArray(parsed.techStack) ? parsed.techStack.map(String) : [],
    effortMinHours: Math.max(1, Math.min(10000, Math.floor(parsed.effortMinHours || 1))),
    effortMaxHours: Math.max(1, Math.min(50000, Math.floor(parsed.effortMaxHours || 1))),
    complexityScore: Math.max(1, Math.min(5, Math.floor(parsed.complexityScore || 3))),
    confidenceScore: Math.max(0, Math.min(1, parseFloat(parsed.confidenceScore || '0.5'))),
  };
  
  // Ensure max >= min
  if (result.effortMaxHours < result.effortMinHours) {
    result.effortMaxHours = result.effortMinHours + Math.ceil(result.effortMinHours * 0.3);
  }
  
  return result;
}

// Main function to analyze a brief
export async function analyzeBrief(briefId: string): Promise<AIAnalysis> {
  // Find or create analysis record
  let analysis = await prisma.aIAnalysis.findUnique({
    where: { briefId },
  });
  
  if (!analysis) {
    analysis = await prisma.aIAnalysis.create({
      data: {
        briefId,
        category: 'OTHER',
        techStack: [],
        features: [],
        requirements: [],
        effortMinHours: 0,
        effortMaxHours: 0,
        complexityScore: 0,
        confidenceScore: 0,
        status: 'PENDING',
        retries: 0,
      },
    });
  }
  
  // Update status to processing
  await prisma.aIAnalysis.update({
    where: { id: analysis.id },
    data: { status: 'PROCESSING' },
  });
  
  // Get the brief
  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
  });
  
  if (!brief) {
    throw new Error(`Brief ${briefId} not found`);
  }
  
  const systemPrompt = buildAnalysisPrompt(brief);
  const userMessage = buildUserMessage(brief);
  
  try {
    // Call the LLM
    const rawResponse = await callLLM(systemPrompt, userMessage);
    
    // Parse the response
    const parsed = parseLLMResponse(rawResponse);
    
    // Save the analysis
    analysis = await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        features: parsed.features,
        requirements: parsed.requirements,
        category: parsed.category,
        techStack: parsed.techStack,
        effortMinHours: parsed.effortMinHours,
        effortMaxHours: parsed.effortMaxHours,
        complexityScore: parsed.complexityScore,
        confidenceScore: parsed.confidenceScore,
        rawPrompt: systemPrompt,
        rawResponse: rawResponse,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    
    return analysis;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const newRetries = analysis.retries + 1;
    
    // Retry up to 3 times
    if (newRetries < 3) {
      console.log(`AI analysis retry ${newRetries} for brief ${briefId}`);
      await new Promise(resolve => setTimeout(resolve, newRetries * 2000)); // Exponential backoff
      
      return analyzeBrief(briefId);
    }
    
    // Max retries reached, mark as failed
    analysis = await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: 'FAILED',
        errorMessage: errorMessage.substring(0, 500),
        retries: newRetries,
      },
    });
    
    console.error(`AI analysis failed for brief ${briefId}: ${errorMessage}`);
    return analysis;
  }
}

// Queue-based processing (for production use)
export async function processPendingAnalyses(): Promise<number> {
  const pendingAnalyses = await prisma.aIAnalysis.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      retries: { lt: 3 },
    },
    take: 5, // Process in batches
  });
  
  let processedCount = 0;
  
  for (const analysis of pendingAnalyses) {
    try {
      await analyzeBrief(analysis.briefId);
      processedCount++;
    } catch (error) {
      console.error(`Failed to process analysis ${analysis.id}:`, error);
    }
  }
  
  return processedCount;
}