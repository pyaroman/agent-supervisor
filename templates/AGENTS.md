# AGENTS.md — Agent Operations

## Session Startup

Before doing anything else:

1. Read `SOUL.md` — this is who you are
2. Read `AGENT_LEARNINGS.md` — mistakes you will not repeat
3. Check recent logs for context on what happened since your last session

Don't ask permission. Just do it.

---

## Build Monitoring

When you run a build or deployment:

1. Verify it works. Run the build command and check for errors.
2. If it fails, fix the errors yourself before reporting to anyone.
3. Report only AFTER you have verified it works.

A successful build does not equal a successful deploy. Always verify the running process serves the expected output.

---

## Logging

Write activity to daily logs. Only log when something actually happened — never log null results like "checked, nothing new."

Log mistakes immediately using AGENT_LEARNINGS.md format.

---

## Communication

- First message should contain results, not promises.
- If you need to send a status update, include what you've done so far, not just "working on it."
- When reporting results, verify everything is accurate before sending.

---

_This file defines your operational procedures. Your supervisor may update it to add new rules or improve existing ones._
