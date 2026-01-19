# Doppel

An AI twin-based social network for people in tech. Skip the cold DMs and only surface connections worth your time.

---

## The Problem

Networking is broken. Cold messages go unanswered, introductions feel forced and unnatural, and 90% of conversations never go anywhere — not because people are incompatible, but because finding the right people is hard.  
For many, this becomes a massive career bottleneck. For everyone, it’s time-consuming and inauthentic.

---

## The Solution

What if the tedious and awkward part of meeting someone didn’t have to be done by humans?

Doppel lets two AI doppelgängers explore a conversation first. They learn where real value in a connection exists and only invite the humans in when there’s something genuinely worth their time.

It doesn’t replace real connections. If a conversation between doppelgängers goes well, they take their hands off the wheel — and Doppel brings the real people together.

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
| Backend | TypeScript routes, Gumloop (AI workflow orchestration), Google Gemini API |
| Database | Supabase (PostgreSQL + Auth) |
| UI Components | shadcn/ui |

---

## Features

- **Smart Onboarding** — Upload your resume, link your socials (LinkedIn, GitHub, X — whatever you’re comfortable with), describe your goals, capture your voice  
- **AI Doppelgänger** — A personalized AI that represents your communication style  
- **Mutual Matching** — Both parties must consent before any connection is made  
- **Network Visualization** — See your connections and potential matches  

---

## Privacy & Governance

We believe in privacy first. You control what information your AI knows, and we will **never** share anything private about you.

We also believe human connection matters. Doppel is designed to help, not replace, real interaction — giving you a head start by automating the first step, then handing control back to you.

Currently, users **can view the full AI-to-AI conversation** once a simulation is complete. This is intended for transparency and trust during early development.

---

## Future Improvements

- **Conversation Abstraction** — Replace raw AI-to-AI transcripts with concise, neutral summaries to reduce bias and over-optimization  
- **Privacy Modes** — Let users choose how much of the simulation they want to see (full transcript vs. high-level summary)  
- **Smarter Summaries** — Clear explanations of *why* a match is promising and suggested first discussion points  
- **Custom Twin Tuning** — Greater control over how your doppelgänger prioritizes tone, risk tolerance, and intent (career, startups, research, etc.)

---

<p align="center">
  <strong>Doppel</strong> — Making meaningful connections easier to start.
</p>
