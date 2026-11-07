import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TestCaseStatus, SubmissionStatus, CodeEvaluationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_ID_MAP } from "@/config/constants";
import { WebhookPayload } from "@/lib/types/config-types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;
    const { code, questionId, language } = await req.json();
    if (!code || !questionId || !language) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { testCases: true, assignment: true },
    });
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    let submission = await prisma.submission.findUnique({
      where: { studentId_assignmentId: { studentId: userId, assignmentId: question.assignmentId } },
    });
    if (!submission) {
      submission = await prisma.submission.create({
        data: { studentId: userId, assignmentId: question.assignmentId, status: SubmissionStatus.IN_PROGRESS },
      });
    }
    const codeSubmission = await prisma.codeSubmission.create({
      data: { submissionId: submission.id, questionId, code, language, codeEvaluationStatus: CodeEvaluationStatus.PENDING },
    });
    const assignment = await prisma.assignment.findUnique({
      where: { id: question.assignmentId },
      include: { metrics: { include: { metric: true } } },
    });
    if (assignment?.metrics.length) {
      await prisma.submissionMetricResult.createMany({
        data: assignment.metrics.map((am) => ({ codeSubmissionId: codeSubmission.id, metricId: am.metricId, score: 0, feedback: "Evaluation pending..." })),
        skipDuplicates: true,
      });
    }
    await prisma.testCaseResult.deleteMany({ where: { codeSubmissionId: codeSubmission.id } });
    await prisma.testCaseResult.createMany({
      data: question.testCases.map((tc) => ({ codeSubmissionId: codeSubmission.id, testCaseId: tc.id, status: TestCaseStatus.PENDING })),
    });
    const testCasePromises = question.testCases.map(async (testCase) => {
      const webhookPayload: WebhookPayload = { codeSubmissionId: codeSubmission.id, testCaseId: testCase.id, questionId };
      const encodedPayload = Buffer.from(JSON.stringify(webhookPayload)).toString("base64");
      const webhookUrl = `${process.env.APP_URL}/api/webhook/judge0?payload=${encodedPayload}`;
      const response = await fetch(
        `https://${process.env.JUDGE0_API_HOST}/submissions?base64_encoded=true&fields=*&callback_url=${encodeURIComponent(webhookUrl)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-key": process.env.JUDGE0_API_KEY || "",
            "x-rapidapi-host": process.env.JUDGE0_API_HOST || "",
          },
          body: JSON.stringify({
            language_id: LANGUAGE_ID_MAP[language as keyof typeof LANGUAGE_ID_MAP],
            source_code: Buffer.from(code).toString("base64"),
            stdin: Buffer.from(testCase.input).toString("base64"),
            expected_output: Buffer.from(testCase.expectedOutput).toString("base64"),
            cpu_time_limit: 2,
            memory_limit: 128000,
          }),
        },
      );
      const judgeData = await response.json();
      if (!judgeData.token) throw new Error(`Failed to submit test case ${testCase.id}`);
      await prisma.testCaseResult.update({
        where: { codeSubmissionId_testCaseId: { codeSubmissionId: codeSubmission.id, testCaseId: testCase.id } },
        data: { judge0Token: judgeData.token },
      });
      return judgeData.token;
    });
    try {
      await Promise.all(testCasePromises);
      return NextResponse.json({ submissionId: codeSubmission.id, message: "Submission created and test cases queued" });
    } catch (error) {
      await prisma.codeSubmission.update({
        where: { id: codeSubmission.id },
        data: { codeEvaluationStatus: CodeEvaluationStatus.TEST_CASES_EVALUATION_FAILED },
      });
      throw error;
    }
  } catch (error: any) {
    console.error("Error in submission:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
