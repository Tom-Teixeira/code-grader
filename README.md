# CodeGrader - Online Code Evaluation & Grading System

CodeGrader is an automated online coding platform designed for college-level programming lab assignments. It simplifies grading by automatically executing student submissions, checking correctness against test cases, and providing instant feedback.

## Features

### Core Features

- **Automated Code Execution & Grading** - Runs submissions and checks correctness against test cases
- **Multiple Language Support** - Supports Python, Java, C++, JavaScript, TypeScript, and more
- **Secure Execution Environment** - Runs code in a sandboxed, isolated environment using Judge0
- **Custom Test Cases** - Teachers can define their own test cases with hidden/public visibility
- **AI-Powered Test Case Generation** - Automatically generate comprehensive test cases using AI based on question descriptions
- **Instant Feedback** - Provides real-time feedback to students with detailed execution results
- **Role-Based Access Control** - Separate interfaces for Faculty and Students

### Faculty Features

- **Classroom Management** - Create and manage virtual classrooms with unique codes
- **Assignment Creation** - Build multi-question assignments with detailed problem statements
- **Live Student Monitoring** - Real-time tracking of student progress and activity
- **Analytics Dashboard** - Comprehensive student progress tracking with export capabilities
- **Submission Review** - Detailed view of student submissions with test case results
- **Performance Analytics** - Track completion rates, scores, and submission patterns

### Student Features

- **Interactive Code Editor** - Monaco editor with syntax highlighting and auto-completion
- **Custom Test Case Testing** - Run code against custom inputs before submission
- **Submission History** - View all previous submissions with detailed feedback
- **Real-time Status Updates** - Live updates on code execution and grading status
- **Restriction Notifications** - Clear feedback when attempting restricted actions

### Security & Proctoring

- **Copy-Paste Prevention** - Disable copy/paste functionality during assignments
- **Fullscreen Enforcement** - Require fullscreen mode to prevent cheating
- **Secure Code Execution** - Sandboxed environment for safe code testing
- **Session Management** - Secure authentication and session handling

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Execution Engine:** Judge0 API
- **Authentication:** NextAuth v5 with Google OAuth
- **LLM:** Groq (Llama 3.3 70B) for test-case generation and code evaluation
- **UI Components:** Shadcn/ui
- **Code Editor:** Monaco Editor
- **Deployment:** Docker Compose

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Docker (optional, for containerized setup)
- Judge0 API key (from RapidAPI)
- Groq API key
- Google OAuth credentials

### Installation

```sh
git clone https://github.com/Tom-Teixeira/code-grader.git
cd code-grader
npm install
```

Set up environment variables (copy `.env.example` to `.env` and fill in values):

```sh
cp .env.example .env
```

Run migrations:

```sh
npx prisma migrate dev
```

Start dev server:

```sh
npm run dev
```

Or with Docker Compose:

```sh
docker-compose up --build
```

---

## Architecture

The platform supports two roles:

- **Faculty**: create classrooms, author assignments with questions and test cases, monitor student progress in real time, and review analytics.
- **Students**: join classrooms via code, solve problems in an integrated Monaco editor, run custom test cases, and submit for automated grading.

Submissions are executed asynchronously via Judge0 CE. Results are delivered through webhook callbacks and reflected in a per-submission state machine (Pending → Running → Passed / Failed / Timeout / Error). LLM-generated test cases and multi-metric code-quality scores are produced by Groq with exponential-backoff retry.

---

## License

Private project. For inquiries, contact 21735749a@gmail.com.
