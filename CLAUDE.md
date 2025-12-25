# claude-harness-demo

## Tech Stack
- Unknown (no package manager files detected)

## Session Startup Protocol

When starting a new session:
1. Run `./init.sh` to see environment status
2. Check `claude-progress.json` for context from last session
3. Run `/harness-start` to see current status and pending features
4. Review any blockers or known issues before proceeding

## Harness Commands

- `/harness-setup` - Initialize harness (already done)
- `/harness-feature` - Add a new feature to track
- `/harness-start` - Show session status and pending features
- `/harness-checkpoint` - Save progress, commit, push, create/update PR
- `/harness-pr` - Manage pull requests
- `/harness-gh-status` - Show GitHub integration dashboard
- `/harness-sync-issues` - Sync features with GitHub issues
- `/harness-orchestrate` - Orchestrate multi-agent teams
- `/harness-merge-all` - Merge all PRs and close issues

## Common Commands

```bash
# Initialize git (if not already)
git init

# Check status
git status

# View harness progress
cat claude-progress.json | jq
```

## Project Structure

```
claude-harness-demo/
├── feature-list.json      # Active features being worked on
├── feature-archive.json   # Completed features archive
├── claude-progress.json   # Session continuity data
├── CLAUDE.md              # This file - project context
└── init.sh                # Environment startup script
```
