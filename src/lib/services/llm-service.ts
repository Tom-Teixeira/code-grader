import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export function buildTestCaseGenerationPrompt(
  title: string,
  description: string,
  language: string,
  sampleInput?: string,
  sampleOutput?: string,
  noTestCases?: number,
): string {
  const testCaseCount = noTestCases || 5;
  const hiddenCount = Math.ceil(testCaseCount * 0.4);
  return `You are a test case generator for programming problems. Generate ${testCaseCount} comprehensive test cases for:\n\n**Problem:** ${title}\n${description}\nLanguage: ${language}\n${sampleInput ? `Sample Input: ${sampleInput}\n` : ""}${sampleOutput ? `Sample Output: ${sampleOutput}\n` : ""}\n\nRequirements:\n1. Generate exactly ${testCaseCount} test cases\n2. Include basic, edge, and corner cases\n3. Make ${hiddenCount} hidden test cases\n4. Return ONLY a valid JSON array with fields: input, expectedOutput, hidden\n`;
}

export async function generateTestCases(prompt: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.3,
    });
    const cleanedText = text.trim();
    const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : cleanedText;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling LLM:", error);
    throw new Error("Failed to generate test cases");
  }
}
