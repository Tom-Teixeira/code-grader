import { LANGUAGE_ID_MAP } from "@/config/constants";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { code, language, input } = await req.json();
    if (!code || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const response = await fetch(
      `https://${process.env.JUDGE0_API_HOST}/submissions?base64_encoded=true&fields=*`,
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
          stdin: input ? Buffer.from(input).toString("base64") : "",
          cpu_time_limit: 2,
          memory_limit: 128000,
        }),
      },
    );
    const judgeData = await response.json();
    if (!judgeData.token) throw new Error(`Failed to compile code`);
    let resultData;
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const resultResponse = await fetch(
        `https://${process.env.JUDGE0_API_HOST}/submissions/${judgeData.token}?base64_encoded=true&fields=*`,
        { headers: { "x-rapidapi-key": process.env.JUDGE0_API_KEY || "", "x-rapidapi-host": "judge0-ce.p.rapidapi.com" } },
      );
      resultData = await resultResponse.json();
      if (resultData.status && resultData.status.id >= 3) break;
    }
    const newResult = { input, runtime: "0s", memory: "0 MB", status: "failed", output: "", error: "", hidden: false };
    if (resultData.status.id === 3) {
      newResult.status = "passed";
      newResult.output = resultData.stdout ? atob(resultData.stdout) : "No output";
      newResult.runtime = `${resultData.time}s`;
      newResult.memory = `${resultData.memory / 1000} MB`;
    } else if (resultData.compile_output) {
      newResult.error = atob(resultData.compile_output);
    } else if (resultData.stderr) {
      newResult.error = atob(resultData.stderr);
    } else if (resultData.status.id === 5) {
      newResult.error = "Time limit exceeded";
    } else if (resultData.status.id === 6) {
      newResult.error = "Memory limit exceeded";
    } else {
      newResult.error = `Execution failed: ${resultData.status.description}`;
    }
    return NextResponse.json({ status: 200, output: newResult });
  } catch (e) {
    console.error("Error running code:", e);
    return NextResponse.json({ status: 400, output: { input: "", runtime: "0s", memory: "0 MB", status: "failed", output: "", error: "Failed to run code. Please try again.", hidden: false } });
  }
}
