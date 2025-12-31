# claude-harness-demo

## Tech Stack
- Node.js monorepo with npm workspaces
- **Client**: React 18, Vite, TypeScript, Tailwind CSS
- **Server**: Express, TypeScript, SQLite (better-sqlite3)

## Session Startup Protocol

When starting a new session:
1. Run `./.claude-harness/init.sh` to see environment status
2. Check `.claude-harness/claude-progress.json` for context from last session
3. Run `/claude-harness:start` to see current status and pending features
4. Review any blockers or known issues before proceeding

## Harness Commands

- `/claude-harness:setup` - Initialize harness (already done)
- `/claude-harness:feature` - Add a new feature to track
- `/claude-harness:start` - Show session status and pending features
- `/claude-harness:checkpoint` - Save progress, commit, push, create/update PR
- `/claude-harness:orchestrate` - Orchestrate multi-agent teams
- `/claude-harness:merge-all` - Merge all PRs and close issues

## Common Commands

```bash
# Start development servers
npm run dev:client    # Vite dev server
npm run dev:server    # Express with nodemon

# Build
npm run build         # Build client

# View harness progress
cat .claude-harness/claude-progress.json | jq
```

## Project Structure

```
claude-harness-demo/
├── client/                    # React frontend (Vite + TypeScript)
├── server/                    # Express backend (TypeScript + SQLite)
├── .claude-harness/           # Harness tracking files
│   ├── feature-list.json      # Active features being worked on
│   ├── feature-archive.json   # Completed features archive
│   ├── claude-progress.json   # Session continuity data
│   ├── agent-context.json     # Multi-agent shared context
│   ├── agent-memory.json      # Persistent agent memory
│   ├── working-context.json   # Active working state
│   └── init.sh                # Environment startup script
├── CLAUDE.md                  # This file - project context
└── package.json               # Root workspace config
```
