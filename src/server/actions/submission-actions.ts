"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TestCaseStatus, CodeEvaluationStatus, SubmissionStatus } from "@prisma/client";
import { evaluateSubmissionMetrics, evaluateSubmissionTestCases } from "./grading-actions";
import { judgeResult } from "@/lib/types/code-types";

export async function processJudgeResultWebhook(
  testCaseId: string,
  codeSubmissionId: string,
  judgeResult: judgeResult,
) {
  try {
    let testCaseStatus: TestCaseStatus;
    let actualOutput = null;
    let errorMessage = null;
    const executionTime = judgeResult.time ? Math.round(parseFloat(judgeResult.time) * 1000) : null;
    if (judgeResult.status.id === 3) {
      testCaseStatus = TestCaseStatus.PASSED;
      if (judgeResult.stdout) actualOutput = Buffer.from(judgeResult.stdout, "base64").toString();
    } else if (judgeResult.status.id === 4) {
      testCaseStatus = TestCaseStatus.FAILED;
      if (judgeResult.stdout) actualOutput = Buffer.from(judgeResult.stdout, "base64").toString();
    } else if (judgeResult.status.id === 5) {
      testCaseStatus = TestCaseStatus.TIMEOUT;
      errorMessage = "Time limit exceeded";
    } else if (judgeResult.compile_output) {
      testCaseStatus = TestCaseStatus.ERROR;
      errorMessage = Buffer.from(judgeResult.compile_output, "base64").toString();
    } else if (judgeResult.stderr) {
      testCaseStatus = TestCaseStatus.ERROR;
      errorMessage = Buffer.from(judgeResult.stderr, "base64").toString();
    } else {
      testCaseStatus = TestCaseStatus.ERROR;
      errorMessage = `Execution failed: ${judgeResult.status.description}`;
    }
    await prisma.testCaseResult.update({
      where: { codeSubmissionId_testCaseId: { codeSubmissionId, testCaseId } },
      data: { status: testCaseStatus, actualOutput, errorMessage, executionTime },
    });
  } catch (error) {
    console.error(`Error processing Judge0 result for ${testCaseId}:`, error);
  }
}

export async function updateCodeSubmissionStatus(codeSubmissionId: string) {
  try {
    const testCaseResults = await prisma.testCaseResult.findMany({ where: { codeSubmissionId } });
    const allProcessed = testCaseResults.every((r) => r.status !== TestCaseStatus.PENDING);
    if (allProcessed) {
      await evaluateSubmissionTestCases(codeSubmissionId);
      const updated = await prisma.codeSubmission.updateMany({
        where: { id: codeSubmissionId, codeEvaluationStatus: "TEST_CASES_EVALUATION_COMPLETE" },
        data: { codeEvaluationStatus: "LLM_EVALUATION_IN_PROGRESS" },
      });
      if (updated.count > 0) {
        evaluateSubmissionMetrics(codeSubmissionId).catch((error) => {
          console.error("Background LLM evaluation failed:", error);
        });
      }
    }
  } catch (error) {
    console.error(`Error updating submission status for ${codeSubmissionId}:`, error);
  }
}

export async function updateSubmissionStatus(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { codeSubmission: true, assignment: { include: { questions: true } } },
  });
  if (!submission) throw new Error("Submission not found");
  const questionIds = submission.assignment.questions.map((q) => q.id);
  const bestSubmissions = questionIds.map((qid) => {
    const subs = submission.codeSubmission.filter(
      (cs) => cs.questionId === qid && cs.codeEvaluationStatus === CodeEvaluationStatus.EVALUATION_COMPLETE,
    );
    return subs.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  });
  const valid = bestSubmissions.filter((cs) => cs !== undefined);
  if (valid.length === questionIds.length) {
    const finalScore = valid.reduce((acc, cs) => acc + (cs.score || 0), 0) / valid.length;
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.COMPLETED, finalScore },
    });
  } else if (valid.length > 0) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.PARTIAL },
    });
  }
}
