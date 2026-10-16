---
version: 1
id: "review-yesterday-s-commits"
name: "Review yesterday's commits"
schedule:
  kind: cron
  expression: "0 9 * * *"
  timeZone: local
---

Review the commits made to this repository since yesterday morning.
1. Fetch the latest changes without touching any branch, then list the commits since yesterday on the active branches.
2. Read each diff. Look for bugs, risky changes (security, data loss, migrations, config), missing or weakened tests, and code that is hard to follow.
3. Write reviews/review-YYYY-MM-DD.md with one section per commit: hash, author, a one-line summary and your findings, most serious first.
4. End with a short list of what a person should look at today.
Do not change code, push, commit the report or comment on pull requests. If there are no new commits, say so in one line.
