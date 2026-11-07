# CodeGrader

A web app for running and grading programming lab assignments. Faculty create classrooms and post multi-question assignments; students write code in the browser and get results back automatically.

## What it does

Student submissions are sent to Judge0, which runs the code in a sandbox and returns output. Each question has a set of test cases (some hidden) that determine whether the submission passes. A Groq-hosted Llama 3.3 model can also generate test cases from a problem description and give a rough code-quality score across a few metrics.

Faculty can track who has submitted, view per-question results, and see basic completion stats. The editor is Monaco with language support for Python, Java, C++, JavaScript, TypeScript, Go, Rust, and a few others.

## Stack

- Next.js 15 (App Router) with React 19 and TypeScript
- Prisma 6 against PostgreSQL
- NextAuth v5 with Google OAuth, JWT sessions, faculty/student roles
- Judge0 CE for code execution
- Groq LLM for test-case generation and scoring
- Docker Compose for local dev (Postgres + app)

## Running it

```
git clone https://github.com/Tom-Teixeira/code-grader.git
cd code-grader
npm install
cp .env.example .env   # fill in Judge0, Groq, and Google OAuth keys
npx prisma migrate dev
npm run dev
```

Alternatively, `docker-compose up --build` starts Postgres and the app together. The app runs on port 3000.

## Schema notes

The Prisma schema has 13 models covering users, classrooms, assignments, questions, test cases, submissions, and LLM evaluation results. Cascade deletes handle cleanup when a classroom or assignment is removed, and the submission flow uses a status enum (pending, running, passed, failed, timeout, error) rather than free-form strings.

Judge0 jobs are capped at 2 seconds of CPU time and 128 MB of memory. LLM calls retry up to three times with exponential backoff and validate the response against a JSON schema before touching the database.

## Contact

21735749a@gmail.com
