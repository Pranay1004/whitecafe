---
description: Auto-memory context recall for Antigravity — progressive session recall adapted from auto-memory principles
---

# Auto-Memory for Antigravity

## Overview
Adapted from the auto-memory CLI tool for Copilot CLI, this workflow enables
Antigravity to leverage its built-in persistent context system (Knowledge Items +
Conversation Logs) for unlimited context recall across sessions.

## How It Works

Antigravity already has a persistent memory system:
- **Knowledge Items (KIs)**: Curated, distilled knowledge in `~/.gemini/antigravity/knowledge/`
- **Conversation Logs**: Raw session logs in `~/.gemini/antigravity/brain/<conversation-id>/`
- **Artifacts**: Structured documents from each session

## Context Recall Protocol (Run on Complex Tasks)

### Tier 1 — Quick Scan (~50 tokens)
// turbo
1. Check KI summaries provided at conversation start
2. Identify relevant past conversations by title/summary

### Tier 2 — Focused Recall (~200 tokens)
3. Read relevant KI artifacts if titles match current task
4. Check `overview.txt` in relevant conversation directories

### Tier 3 — Deep Recall (~500 tokens)
5. Read full conversation artifacts for detailed context
6. Cross-reference with current workspace state

## When to Use This Workflow

- Starting a new session on an existing project
- Resuming work after a context reset
- Complex multi-phase tasks requiring historical context
- Debugging issues that may have been addressed before

## Integration

This workflow is automatically available via the `/auto-memory` slash command.
The agent should check conversation summaries at the start of each complex task
to avoid re-explaining context.

## Key Principle
> "It's not unlimited context. It's unlimited context recall."
> Your working memory stays finite, but effective recall becomes unbounded
> via targeted queries to past sessions.
