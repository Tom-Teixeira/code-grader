# CodeGrader - Online Code Evaluation & Grading System

CodeGrader is an automated online coding platform designed for college-level programming lab assignments. It simplifies grading by automatically executing student submissions, checking correctness against test cases, and providing instant feedback.

🔗 [Live Demo](http://localhost:3000)

📘 Student Classroom Join Code: `8e343e`

## Features

### 🎯 **Core Features**

- **Automated Code Execution & Grading** - Runs submissions and checks correctness against test cases
- **Multiple Language Support** - Supports Python, Java, C++, JavaScript, TypeScript, and more
- **Secure Execution Environment** - Runs code in a sandboxed, isolated environment using Judge0
- **Custom Test Cases** - Teachers can define their own test cases with hidden/public visibility
- **AI-Powered Test Case Generation** - Automatically generate comprehensive test cases using AI based on question descriptions
- **Instant Feedback** - Provides real-time feedback to students with detailed execution results
- **Role-Based Access Control** - Separate interfaces for Faculty and Students

### 🏫 **Faculty Features**

- **Classroom Management** - Create and manage virtual classrooms with unique codes
- **Assignment Creation** - Build multi-question assignments with detailed problem statements
- **Live Student Monitoring** - Real-time tracking of student progress and activity
- **Analytics Dashboard** - Comprehensive student progress tracking with export capabilities
- **Submission Review** - Detailed view of student submissions with test case results
- **Performance Analytics** - Track completion rates, scores, and submission patterns

### 👨‍🎓 **Student Features**

- **Interactive Code Editor** - Monaco editor with syntax highlighting and auto-completion
- **Custom Test Case Testing** - Run code against custom inputs before submission
- **Submission History** - View all previous submissions with detailed feedback
- **Real-time Status Updates** - Live updates on code execution and grading status
- **Restriction Notifications** - Clear feedback when attempting restricted actions

### 🔒 **Security & Proctoring**

- **Copy-Paste Prevention** - Disable copy/paste functionality during assignments
- **Fullscreen Enforcement** - Require fullscreen mode to prevent cheating
- **Secure Code Execution** - Sandboxed environment for safe code testing
- **Session Management** - Secure authentication and session handling

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM 6
- **Database:** PostgreSQL
- **Execution Engine:** Judge0 API + Custom Execution Server
- **Authentication:** NextAuth.js v5 with OAuth providers
- **UI Components:** Shadcn/ui, Radix UI
- **Animations:** Framer Motion
- **Code Editor:** Monaco Editor with syntax highlighting
- **AI:** Groq SDK for AI-powered test-case generation and code evaluation
- **Deployment:** Vercel, Docker support

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker (optional, for containerized setup)

### Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, AUTH_SECRET, OAuth credentials, Judge0 API key

# 3. Run database migrations
npx prisma migrate dev

# 4. Start dev server
npm run dev
```

### Docker Compose
```bash
docker-compose up --build
# App runs at http://localhost:3000
```

---

## Architecture

CodeGrader follows a modern full-stack architecture:

- **Next.js App Router** with server components and API routes
- **Prisma ORM** with typed database access and migration system
- **Judge0 sandbox** for secure code execution across 10+ programming languages
- **NextAuth v5** with Google OAuth and role-based access control (Faculty/Student)
- **Groq LLM integration** for AI-powered test-case generation and code feedback
- **Structured scoring pipeline**: test-case execution (60%) + LLM metric evaluation (40%)

---

## Contact

For any inquiries, please reach out to 21735749a@gmail.com.