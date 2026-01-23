# Doppel Backend Architecture Snapshot
**Date:** January 21, 2026

---

## System Overview

Doppel is a professional networking AI platform built on Next.js with TypeScript. The backend orchestrates AI-powered profile generation, agent conversations, and connection matching using Google Gemini API.

**Key Stack:**
- **Runtime:** Node.js (Next.js 15+, Vercel-hosted)
- **Database:** Supabase (PostgreSQL)
- **AI Provider:** Google Gemini 1.5 Flash (gemini-2.5-flash-lite)
- **Orchestration:** Gumloop (email/workflow automation)
- **Authentication:** Supabase Auth

---

## API Routes Architecture

### 1. **POST /api/ingest** - Soul File Generation
**Purpose:** Extract and synthesize user persona from documents and writing samples.

**Flow:**
1. Accept resume/LinkedIn PDFs + voice samples (written text)
2. Parse unified profile using Gemini with structured schema
3. Analyze voice DNA (conversation style, tone, vocabulary)
4. Generate persona: identity, skills, raw assets, voice signature
5. Store in Supabase `personas` table

**Key Components:**
- `voiceDnaSchema` - Extracts internal monologue & conversation voice
- `personaSchema` - Full persona structure with identity, style, goals, analysis
- `synthesisModel` - Calls Gemini to unify resume + LinkedIn data
- `analyzeVoiceDNA()` - Separate function for voice extraction

**Output Model:** Structured JSON with 300+ fields covering demographics, skills, experience, projects, voice signature

**Timeout:** Default 60s (Vercel limit)

---

### 2. **POST /api/onboard** - Unified Profile Parsing
**Purpose:** Parse resume and LinkedIn PDFs into a "Golden Record" user profile.

**Flow:**
1. Accept base64-encoded resume + LinkedIn PDFs
2. Use Gemini multi-modal API to extract content from both sources
3. Merge data with conflict resolution rules (LinkedIn > Resume for dates)
4. Apply Gatekeeper synthesis (detect role, seniority, skills)
5. Return structured profile object

**Key Schemas:**
- `unifiedProfileSchema` - 100+ fields for identity, skills, experience, education, projects
- **Conflict Rules:**
  - Dates: Trust LinkedIn (more current)
  - Titles: Trust modest version unless revenue metrics present
  - Merging: Avoid duplicates, capture maximum detail

**Role Detection:** Uses "voice tone" classification (Hacker, Corporate, Academic, Student)

**Timeout:** 60s

---

### 3. **POST /api/simulation/auto-connect** - Agent Conversations
**Purpose:** Run AI-to-AI coffee chat simulations between two DoppelAgents.

**Flow:**
1. Fetch initiator's profile + persona from `users` table
2. Find top N candidate matches from `connections` table
3. For each candidate:
   - Instantiate two DoppelAgent objects with their personas
   - Run 6-turn conversation (Initiator → Target → repeat)
   - Capture transcript
4. Score conversation (0-100) using Judge agent
5. Extract takeaways (key shared interests, opportunities)
6. Store in `simulations` table with score & transcript

**DoppelAgent Class:**
- Constructor takes `AgentPersona` (ID, name, identity, networking goals, skills, raw assets)
- `reply()` method: Generates next message using Gemini
- Maintains conversation history (last 6 messages)
- Retry logic for rate limits (exponential backoff up to 3 attempts)

**Timeout:** 300s (5 minutes for multiple simulations)

---

### 4. **POST /api/send-coffee-chat** - Match Notification
**Purpose:** Send coffee chat invitation email via Gumloop after high-compatibility match.

**Flow:**
1. Fetch simulation data by ID (with fallback to participant-based lookup)
2. Verify sender authorization (must be participant in simulation)
3. Get receiver email from `auth.users`
4. Fetch user names from `users` table
5. Extract conversation summary/takeaways
6. Call Gumloop API to send automated email with:
   - Sender name, receiver name
   - Compatibility score + compatibility metrics
   - Key talking points from simulation
   - Link to accept/decline

**Gumloop Integration:**
- `GUMLOOP_USER_ID:` gNDc8nrosdYwaeVhycwWU0jrWq83
- `GUMLOOP_PIPELINE_ID:` wAhemDytcy4eatmbekL5h6
- `GUMLOOP_KEY_2:` API credentials for Gumloop

**Fallback Logic:** If simulation not found by ID, search by (participant1, participant2) pairs

---

## Core Libraries

### DoppelAgent (`/lib/DoppelAgent.ts`)
Stateful AI agent class for conversation simulation.

**Key Methods:**
- `constructor(persona: AgentPersona)` - Initialize with user profile
- `reply(lastMessage: string | null)` - Generate next response (120 tokens max)
- Retry logic: Catches 429/rate-limit errors, exponential backoff

**Prompt Engineering:**
- System prompt includes all persona data (skills, goals, voice signature)
- Context window: Last 6 messages
- Temperature: 0.7 (balanced creativity + consistency)

---

## Data Models

### Key Tables (Supabase)

**personas** table:
- User's AI agent profile (generated from ingest)
- JSON fields: identity, style, goals, skills, raw_assets, voice_dna
- ~300 fields total

**users** table:
- Core user record (id, email, name, created_at)
- Foreign key: persona_id

**simulations** table:
- Columns: id, participant1, participant2, transcript[], score, takeaways, created_at
- Stores complete conversation transcript (6 turns max)

**connections** table:
- Matches between users
- Status: pending | simulated | matched | rejected | connected
- Scores: compatibility, relevance, reciprocity, tone_match

---

## AI Model Configuration

**Primary Model:** `gemini-2.5-flash-lite`
- Used across all endpoints
- Structured output with JSON schemas
- ~1M tokens context window

**Schema-Driven Generation:**
- `voiceDnaSchema` - Voice signature extraction
- `personaSchema` - Full persona synthesis
- `unifiedProfileSchema` - Profile unification

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://fswrfpoyucgqytgbdslr.supabase.co
SERVICE_ROLE_KEY=eyJ...                                    # DB access
GEMINI_API_KEY=AIzaSy...                                   # Google AI
GUMLOOP_KEY_2=f678b...                                     # Email automation
APIFY_API_TOKEN=apify_api_...                              # X/Twitter data (legacy)
```

---

## Error Handling & Reliability

**Rate Limiting:**
- Auto-retry logic in DoppelAgent.reply() (max 3 attempts)
- Exponential backoff: 2^retries * 1000ms

**Validation:**
- Persona required before simulation
- Sender authorization checks in send-coffee-chat
- Graceful fallbacks (search by participants if ID lookup fails)

**Logging:**
- Console logs for ingest progress
- Error messages with context (e.g., "Gemini API failed: {message}")

---

## Known Issues & Improvements

### Current Limitations:
1. **Hard-coded Model:** Gemini 1.5 Flash referenced across 4 files
   - Future: Implement provider abstraction for flexibility
2. **Schema Duplication:** Voice/persona schemas live in ingest.ts
   - Future: Extract to shared lib/schemas.ts
3. **No Rate Limit Header Parsing:** Uses generic error messages
   - Future: Parse X-RateLimit headers for smarter backoff
4. **Gumloop Dependency:** Email sending tightly coupled
   - Future: Abstraction layer for multi-provider support

### Potential Optimizations:
- Cache persona generation (avoid re-ingest for updated profiles)
- Batch simulations (parallel candidate matching)
- Conversation history compression for long chats
- Premium model (gemini-2.0-flash) for complex profiles

---

## Deployment Notes

**Vercel Configuration:**
- Next.js 15+ recommended
- Build: `next build`
- Start: `next start`
- Route timeout limits respected (60s default, 300s for simulations)

**Dependencies:**
- `@google/generative-ai` (^0.24.1) - Gemini API
- `@supabase/supabase-js` - DB client
- `next` (15+)
- `typescript` (5+)

---

## Roadmap Considerations

1. **Multi-model Support:** Abstract AI provider (OpenAI, Anthropic)
2. **Streaming Responses:** Real-time agent conversations
3. **Caching Layer:** Redis for persona/profile caching
4. **Analytics:** Track match quality, conversation patterns
5. **Safety Guards:** Content moderation on profiles & transcripts
