# Usage

See what each pool has spent.

```bash
ahpd usage                # the pools you may read
ahpd usage team:backend   # today, this week, this month
```

| Command | HTTP |
| --- | --- |
| `ahpd usage` | `GET /api/usage` |
| `ahpd usage <pool>` | `GET /api/usage/<pool>` |

Anyone may read their own `user:` pool and the `team:` and `project:` pools they belong to. Any other pool needs `usage:read`.

The days are cut in `usage.timezone`. The records and the pools are in [sdk/USAGE.md](../sdk/USAGE.md).
