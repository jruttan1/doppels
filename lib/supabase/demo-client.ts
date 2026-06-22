type DemoRow = Record<string, any>

type DemoDb = {
  users: DemoRow[]
  simulations: DemoRow[]
}

type DemoAuthState = {
  loggedOut: boolean
  user: DemoRow
}

const DB_KEY = "doppel-demo-db"
const AUTH_KEY = "doppel-demo-auth"
const DEMO_USER_ID = "demo-user-0001"

const seedDb = (): DemoDb => ({
  users: [
    {
      id: DEMO_USER_ID,
      email: "avery@doppel.dev",
      name: "Avery Chen",
      tagline: "Product designer @ Northstar | Builds in public",
      location: "San Francisco, CA",
      avatar_url: null,
      linkedin_url: "https://linkedin.com/in/averychen",
      github_url: "https://github.com/averychen",
      x_url: "https://x.com/averychen",
      google_calendar_url: "https://calendar.google.com/calendar/u/0/r",
      networking_goals: ["Meet product-minded founders", "Find design partners"],
      skills: ["Product design", "Figma", "Prototyping", "Writing"],
      skills_desired: ["Engineering", "Growth", "AI"],
      location_desired: ["San Francisco, CA", "New York, NY"],
      persona: {
        identity: { role: "Product designer", company: "Northstar" },
        skills_possessed: ["Product design", "Figma", "Prototyping", "Writing"],
        agent_active: true,
        selective_connect: false,
        notifications: { email: true, match_alerts: true, weekly_digest: false },
        voice_signature:
          "I like concise collaboration and I care about shipping polished things.\n\n---\n\nI tend to ask sharp questions and keep momentum high.\n\n---\n\nI am friendly, direct, and practical.",
      },
    },
    {
      id: "demo-user-0002",
      email: "morgan@harbor.dev",
      name: "Morgan Lee",
      tagline: "Founding engineer @ Harbor",
      location: "Brooklyn, NY",
      avatar_url: null,
      linkedin_url: "https://linkedin.com/in/morganlee",
      github_url: "https://github.com/morganlee",
      x_url: "https://x.com/morganlee",
      networking_goals: ["Find design feedback", "Meet operators"],
      skills: ["TypeScript", "Systems design", "Product thinking"],
      persona: {
        identity: { role: "Founding engineer", company: "Harbor" },
        skills_possessed: ["TypeScript", "Systems design", "Product thinking"],
        agent_active: true,
        selective_connect: true,
        notifications: { email: true, match_alerts: true, weekly_digest: true },
      },
    },
    {
      id: "demo-user-0003",
      email: "sam@pulse.ai",
      name: "Sam Patel",
      tagline: "AI researcher @ Pulse",
      location: "Austin, TX",
      avatar_url: null,
      linkedin_url: "https://linkedin.com/in/sampatel",
      github_url: "https://github.com/sampatel",
      x_url: "https://x.com/sampatel",
      networking_goals: ["Meet founders", "Share model ideas"],
      skills: ["Machine learning", "Research", "Python"],
      persona: {
        identity: { role: "AI researcher", company: "Pulse" },
        skills_possessed: ["Machine learning", "Research", "Python"],
        agent_active: true,
        selective_connect: false,
        notifications: { email: true, match_alerts: true, weekly_digest: false },
      },
    },
    {
      id: "demo-user-0004",
      email: "jordan@atlas.co",
      name: "Jordan Kim",
      tagline: "Growth lead @ Atlas",
      location: "Los Angeles, CA",
      avatar_url: null,
      linkedin_url: "https://linkedin.com/in/jordankim",
      github_url: null,
      x_url: "https://x.com/jordankim",
      networking_goals: ["Meet technical founders", "Swap hiring notes"],
      skills: ["Growth", "Analytics", "Go-to-market"],
      persona: {
        identity: { role: "Growth lead", company: "Atlas" },
        skills_possessed: ["Growth", "Analytics", "Go-to-market"],
        agent_active: true,
        selective_connect: false,
        notifications: { email: true, match_alerts: false, weekly_digest: true },
      },
    },
  ],
  simulations: [
    {
      id: "sim-0001",
      participant1: DEMO_USER_ID,
      participant2: "demo-user-0002",
      score: 92,
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      transcript: [
        { speaker: "Avery", text: "I care a lot about how people make decisions under uncertainty." },
        { speaker: "Morgan", text: "That lines up. I like product work where the constraints are messy but the outcome is clear." },
      ],
      takeaways: ["Strong product-engineering alignment", "High trust on execution speed"],
    },
    {
      id: "sim-0002",
      participant1: DEMO_USER_ID,
      participant2: "demo-user-0003",
      score: 84,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      transcript: [
        { speaker: "Avery", text: "I want to keep conversations practical and open-ended." },
        { speaker: "Sam", text: "Perfect. I can usually tell pretty quickly when a conversation has signal." },
      ],
      takeaways: ["Good fit for technical introductions", "Shared interest in AI tooling"],
    },
    {
      id: "sim-0003",
      participant1: DEMO_USER_ID,
      participant2: "demo-user-0004",
      score: 66,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      transcript: [
        { speaker: "Avery", text: "I’m looking for deeper product conversations than a quick intro." },
        { speaker: "Jordan", text: "Same here. I like when the first chat is actually useful." },
      ],
      takeaways: ["Solid signal but lower urgency", "Could reconnect later"],
    },
  ],
})

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

const browserReady = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined"

const readDb = (): DemoDb => {
  if (!browserReady()) {
    return seedDb()
  }

  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (!raw) {
      const seeded = seedDb()
      window.localStorage.setItem(DB_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as DemoDb
    const seeded = seedDb()
    const users = seeded.users.map((seedUser) => {
      const existingUser = parsed.users?.find((user) => user.id === seedUser.id)
      return existingUser ? { ...seedUser, ...existingUser } : seedUser
    })

    return {
      users: [
        ...users,
        ...(parsed.users || []).filter((user) => !users.some((seedUser) => seedUser.id === user.id)),
      ],
      simulations: parsed.simulations?.length ? parsed.simulations : seeded.simulations,
    }
  } catch {
    return seedDb()
  }
}

const writeDb = (db: DemoDb) => {
  if (browserReady()) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db))
  }
}

const readAuthState = (): DemoAuthState => {
  const seedUser = seedDb().users.find((user) => user.id === DEMO_USER_ID)!

  if (!browserReady()) {
    return { loggedOut: false, user: seedUser }
  }

  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (!raw) {
      const state = { loggedOut: false, user: seedUser }
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(state))
      return state
    }

    const parsed = JSON.parse(raw) as DemoAuthState
    return {
      loggedOut: Boolean(parsed.loggedOut),
      user: parsed.user ? { ...seedUser, ...parsed.user } : seedUser,
    }
  } catch {
    return { loggedOut: false, user: seedUser }
  }
}

const writeAuthState = (state: DemoAuthState) => {
  if (browserReady()) {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(state))
  }
}

const getValue = (row: DemoRow, column: string) => row[column]

const compare = (left: any, right: any) => {
  const leftTime = Date.parse(left)
  const rightTime = Date.parse(right)
  if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
    return leftTime - rightTime
  }
  if (left === right) return 0
  return left > right ? 1 : -1
}

class DemoQueryBuilder {
  private filters: Array<(row: DemoRow) => boolean> = []
  private orderBy: { column: string; ascending: boolean } | null = null
  private limitCount: number | null = null
  private mode: "select" | "update" | "upsert" | "insert" = "select"
  private payload: DemoRow | DemoRow[] | null = null
  private singleMode: "single" | "maybeSingle" | null = null

  constructor(private table: keyof DemoDb) {}

  select() { this.mode = "select"; return this }
  update(values: DemoRow) { this.mode = "update"; this.payload = values; return this }
  upsert(values: DemoRow | DemoRow[]) { this.mode = "upsert"; this.payload = values; return this }
  insert(values: DemoRow | DemoRow[]) { this.mode = "insert"; this.payload = values; return this }
  eq(column: string, value: any) { this.filters.push((row) => getValue(row, column) === value); return this }
  neq(column: string, value: any) { this.filters.push((row) => getValue(row, column) !== value); return this }
  gte(column: string, value: any) { this.filters.push((row) => Number(getValue(row, column)) >= Number(value)); return this }
  in(column: string, values: any[]) { this.filters.push((row) => values.includes(getValue(row, column))); return this }
  not(column: string, operator: string, value: any) {
    this.filters.push((row) => {
      const current = getValue(row, column)
      if (operator === "is") return !(value === null ? current == null : current === value)
      if (operator === "eq") return current !== value
      return true
    })
    return this
  }
  order(column: string, options: { ascending?: boolean } = {}) { this.orderBy = { column, ascending: options.ascending !== false }; return this }
  limit(count: number) { this.limitCount = count; return this }
  single() { this.singleMode = "single"; return this }
  maybeSingle() { this.singleMode = "maybeSingle"; return this }
  then(onFulfilled?: any, onRejected?: any) { return this.execute().then(onFulfilled, onRejected) }

  private execute() {
    const db = readDb()
    const rows = clone(db[this.table] || []) as DemoRow[]
    const filtered = this.filters.reduce((currentRows, filter) => currentRows.filter(filter), rows)

    if (this.mode === "select") {
      const ordered = this.orderBy
        ? [...filtered].sort((left, right) => {
            const result = compare(left[this.orderBy!.column], right[this.orderBy!.column])
            return this.orderBy!.ascending ? result : -result
          })
        : filtered
      const limited = this.limitCount != null ? ordered.slice(0, this.limitCount) : ordered

      if (this.singleMode === "single") {
        return Promise.resolve(limited.length ? { data: limited[0], error: null } : { data: null, error: { code: "PGRST116", message: "No rows found" } })
      }

      if (this.singleMode === "maybeSingle") {
        return Promise.resolve({ data: limited[0] || null, error: null })
      }

      return Promise.resolve({ data: limited, error: null })
    }

    if (this.mode === "update") {
      const updatedRows: DemoRow[] = []
      db[this.table] = rows.map((row) => {
        if (!this.filters.every((filter) => filter(row))) return row
        const nextRow = { ...row, ...(this.payload as DemoRow) }
        updatedRows.push(nextRow)
        return nextRow
      })
      writeDb(db)
      return Promise.resolve({ data: updatedRows, error: null })
    }

    if (this.mode === "insert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload]
      db[this.table] = [...rows, ...values.filter(Boolean)]
      writeDb(db)
      return Promise.resolve({ data: values, error: null })
    }

    if (this.mode === "upsert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload]
      const nextRows = [...rows]
      const upsertedRows: DemoRow[] = []

      values.filter(Boolean).forEach((value) => {
        const index = value.id ? nextRows.findIndex((row) => row.id === value.id) : -1
        if (index >= 0) {
          nextRows[index] = { ...nextRows[index], ...value }
          upsertedRows.push(nextRows[index])
        } else {
          nextRows.push(value)
          upsertedRows.push(value)
        }
      })

      db[this.table] = nextRows
      writeDb(db)
      return Promise.resolve({ data: upsertedRows, error: null })
    }

    return Promise.resolve({ data: null, error: null })
  }
}

const syncDemoUser = (patch: Partial<DemoRow>) => {
  const db = readDb()
  const index = db.users.findIndex((user) => user.id === DEMO_USER_ID)
  const current = index >= 0 ? db.users[index] : seedDb().users.find((user) => user.id === DEMO_USER_ID)!
  const merged = { ...current, ...patch }

  if (index >= 0) {
    db.users[index] = merged
  } else {
    db.users.unshift(merged)
  }

  writeDb(db)
  writeAuthState({ loggedOut: false, user: merged })
}

export function createDemoClient() {
  return {
    auth: {
      async getUser() {
        const authState = readAuthState()
        return authState.loggedOut ? { data: { user: null }, error: null } : { data: { user: authState.user }, error: null }
      },
      async signInWithPassword({ email }: { email: string; password: string }) {
        syncDemoUser({ email })
        return { data: { user: readAuthState().user }, error: null }
      },
      async signUp({ email, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) {
        const current = readAuthState().user
        syncDemoUser({
          email,
          name: options?.data?.full_name || current.name,
          location: options?.data?.location || current.location,
          user_metadata: {
            full_name: options?.data?.full_name || current.name,
            location: options?.data?.location || current.location,
          },
        })
        return { data: { user: readAuthState().user }, error: null }
      },
      async signOut() {
        const state = readAuthState()
        writeAuthState({ ...state, loggedOut: true })
        return { error: null }
      },
    },
    from(table: keyof DemoDb) {
      return new DemoQueryBuilder(table)
    },
  }
}