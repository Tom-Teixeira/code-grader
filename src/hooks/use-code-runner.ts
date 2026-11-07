import { CodeRunner } from "@/lib/types/code-types";
import { useState } from "react";
import { toast } from "sonner";

interface useCodeRunnerParams {
  code: string;
  language: string;
  questionId: string;
  input?: string;
}

export function useCodeRunner({ code, language, questionId, input }: useCodeRunnerParams) {
  const [isRunning, setIsRunning] = useState(false);
  const [codeStatus, setCodeStatus] = useState("");
  const [testResults, setTestResults] = useState<CodeRunner[]>([]);

  const runCode = async () => {
    if (isRunning) { toast.warning("Code already running"); return; }
    if (!code.trim()) { toast.error("Please enter code"); return; }
    setIsRunning(true);
    setCodeStatus("Running");
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, input, language }),
      });
      const { output } = await res.json();
      setTestResults([output]);
    } catch (error: any) {
      toast.error(error.message || "Failed to run code");
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (isRunning) return;
    if (!code.trim()) { toast.error("Please enter code"); return; }
    setIsRunning(true);
    setTestResults([]);
    setCodeStatus("Submitting...");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, questionId, language }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      await pollSubmissionStatus(data.submissionId);
    } catch (error: any) {
      setCodeStatus(`Failed: ${error.message}`);
      toast.error(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const pollSubmissionStatus = async (submissionId: string) => {
    let completed = false;
    let attempts = 0;
    while (!completed && attempts < 30) {
      attempts++;
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch(`/api/submissions/${submissionId}`);
        if (!res.ok) continue;
        const data = await res.json();
        setTestResults(data.results || []);
        if (["EVALUATION_COMPLETE", "TEST_CASES_EVALUATION_FAILED", "LLM_EVALUATION_FAILED"].includes(data.status)) {
          completed = true;
        }
      } catch {}
    }
  };

  return { isRunning, codeStatus, testResults, runCode, submitCode };
}
