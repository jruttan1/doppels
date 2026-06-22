# Doppel

An AI twin-based social network for people in tech. Skip the cold DMs and only surface connections worth your time.

---

## The Problem

Networking is broken. Cold messages go unanswered, introductions feel forced and unnatural, and 90% of conversations never go anywhere — not because people are incompatible, but because finding the right people is hard.  
For many, this becomes a massive career bottleneck. For everyone, it’s time-consuming and inauthentic.

---

## The Solution

What if the tedious and awkward part of meeting someone didn’t have to be done by humans?

Doppels lets two AI doppelgängers explore a conversation first. They learn where real value in a connection exists and only invite the humans in when there’s something genuinely worth their time.

It doesn’t replace real connections. If a conversation between doppelgängers goes well, they take their hands off the wheel — and Doppels brings the real people together.

**Fewer conversations. Better ones.**

---

## How It Works

1. **Create your profile** — Share your interests, goals, and optionally link your LinkedIn, GitHub, or other socials  
2. **Your doppelgänger is born** — An AI that reflects how you communicate and what you’re looking for  
3. **Doppelgängers talk first** — When you’re a potential match with someone, your AIs have a structured conversation  
4. **Quality is evaluated** — A separate model scores alignment based on shared interests, communication flow, and intent  
5. **You decide** — If the conversation shows promise, both users receive a summary and can choose to connect  

Nothing is sent automatically. No one is matched without mutual consent.

---

## Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | TypeScript routes, Google Gemini API, Supabase Realtime |
| Database | Supabase (PostgreSQL + demo auth mode) |
| UI Components | shadcn/ui |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### Environment Variables

```env
# Demo auth for local review and screenshots
NEXT_PUBLIC_DEMO_AUTH=true

# Supabase public client config used by the app and API routes
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional auth redirect override for signup emails
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Optional site URL used by API fallbacks
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Required for API routes that write data or send simulations
SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI and orchestration keys used by onboarding and ingest flows
GEMINI_API_KEY=your_gemini_api_key
GUMLOOP_API_KEY=your_gumloop_api_key
GUMLOOP_KEY_2=your_optional_second_gumloop_key
GUMLOOP_PIPELINE_ID=your_gumloop_pipeline_id
GUMLOOP_USER_ID=your_gumloop_user_id
GUMLOOP_X_API_KEY=your_gumloop_x_api_key
GUMLOOP_X_PIPELINE_ID=your_gumloop_x_pipeline_id
GUMLOOP_X_USER_ID=your_gumloop_x_user_id

# Optional integrations used by parts of the ingest flow
GITHUB_TOKEN=your_github_token
```

### Build Commands

- `pnpm dev` starts the development server.
- `pnpm build` creates a production build.
- `pnpm start` runs the production server after building.
- `pnpm lint` runs ESLint across the repo.

## Features

- **Smart Onboarding** — Upload your resume, link your socials (LinkedIn, GitHub — whatever you’re comfortable with), describe your goals, capture your voice  
- **AI Doppelgänger** — A personalized AI that represents your communication style  
- **Mutual Matching** — Both parties must consent before any connection is made  
- **Network Visualization** — See your connections and potential matches  

---

## Privacy & Governance

We believe in privacy first. You control what information your AI knows, and we will **never** share anything private about you.

We also believe human connection matters. Doppel is designed to help, not replace, real interaction — giving you a head start by automating the first step, then handing control back to you.

Users cannot view the full AI-to-AI conversation once a simulation is complete. We want users to focus on takeaways as opposed to raw AI conversations.
---

## Future Improvements

- **Conversation Abstraction** — Replace raw AI-to-AI transcripts with concise, neutral summaries to reduce bias and over-optimization  
- **Privacy Modes** — Let users choose how much of the simulation they want to see (full transcript vs. high-level summary)  
- **Smarter Summaries** — Clear explanations of *why* a match is promising and suggested first discussion points  
- **Custom Twin Tuning** — Greater control over how your doppelgänger prioritizes tone, risk tolerance, and intent (career, startups, research, etc.)

---

## 🏆 V1 Contributors (McHacks 13)

Doppel originated at **McHacks 13** taking home a top 5 overall finish & best design. The V1 prototype was built during a 24-hour sprint by a talented team of engineers.

* **[Eldiiar Bekbolotov](https://www.linkedin.com/in/eldiiar/)** – *Frontend & Design*
* **[Karan Anand](https://www.linkedin.com/in/karananandubc/)** – *Data Ingestion Pipeline & Automation Integration*
* **[Yazdan Rasoulzadeh](https://www.linkedin.com/in/yaz-raso/)** – *Conversation Engine & Business Logic*

<p align="center">
  <strong>Doppels</strong> — Making meaningful connections easier to start.
</p>
