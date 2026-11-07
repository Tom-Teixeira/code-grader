import { AssignmentMetric, EvaluationMetric } from "@prisma/client";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

interface CodeEvaluationRequest {
  code: string;
  language: string;
  questionTitle: string;
  questionDescription: string;
  metrics: (AssignmentMetric & { metric: EvaluationMetric })[];
}

interface MetricEvaluationResult {
  metricId: string;
  metricName: string;
  score: number;
  feedback: string;
}

export function buildCodeEvaluationPrompt(request: CodeEvaluationRequest): string {
  const { code, language, questionTitle, questionDescription, metrics } = request;
  const metricsSection = metrics
    .map((m) => `- **${m.metric.name}** (ID: ${m.metricId}, Weight: ${m.weight}%): ${m.metric.description || ""}`)
    .join("\n");
  return `Evaluate this code submission:\n\n**Question:** ${questionTitle}\n${questionDescription}\n**Language:** ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Metrics:**\n${metricsSection}\n\nScore 0-100 for each metric with 1-2 sentences feedback. Return ONLY JSON: {"evaluations":[{"metricId":"...","metricName":"...","score":85,"feedback":"..."}]}`;
}

export async function evaluateCodeWithLLM(
  request: CodeEvaluationRequest,
): Promise<{ evaluations: MetricEvaluationResult[] }> {
  if (!request.code || !request.language || !request.metrics?.length) {
    throw new Error("Missing required fields");
  }
  const maxRetries = 3;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = buildCodeEvaluationPrompt(request);
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt,
        temperature: 0.3,
      });
      const cleanedText = text.trim();
      const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : cleanedText;
      const response = JSON.parse(jsonText);
      if (!validateEvaluationResponse(response)) {
        throw new Error("Invalid evaluation response format");
      }
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw new Error(`LLM evaluation failed after ${maxRetries} attempts: ${lastError?.message}`);
}

export function validateEvaluationResponse(response: any): response is { evaluations: MetricEvaluationResult[] } {
  if (!response || !Array.isArray(response.evaluations)) return false;
  return response.evaluations.every(
    (e: any) =>
      typeof e.metricId === "string" &&
      typeof e.score === "number" &&
      e.score >= 0 &&
      e.score <= 100 &&
      typeof e.feedback === "string",
  );
}
