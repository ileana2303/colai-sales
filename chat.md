# Chat API

The `/api/v1/chat` routes are how a client talks to the assistant: create a
conversation, stream a reply over Server-Sent Events, and read back what was
said and which SQL was run.

Implementation: [chat.py](../backend/app/api/routes/chat.py).

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/v1/chat/models` | Selectable model ids and the default |
| `POST` | `/api/v1/chat/conversations` | Create a conversation (fixes its scope) |
| `GET` | `/api/v1/chat/conversations` | List conversations, most recently active first |
| `POST` | `/api/v1/chat/conversations/{id}/stream` | Send a message, stream the reply (SSE) |
| `GET` | `/api/v1/chat/conversations/{id}/messages` | Conversation history |
| `GET` | `/api/v1/chat/conversations/{id}/queries` | Recorded tool calls (the SQL behind the answers) |
| `DELETE` | `/api/v1/chat/conversations/{id}` | Delete the conversation and its history |

---

## Authentication

The router requires authentication as a whole
([chat.py:49](../backend/app/api/routes/chat.py#L49)), and accepts **either**
credential. Both are sent the same way:

```
Authorization: Bearer <token>
```

| Credential | Who | What it can see |
| ---------- | --- | --------------- |
| Superadmin JWT (from `/api/v1/login/access-token`) | A person using the admin panel | Every area, including unscoped conversations |
| Static `CHAT_API_KEY` | A machine client — the external app | One area, named on every request |

These endpoints deliberately do **not** resolve a user
(`require_authentication`, not `CurrentUser`). Conversations have no owner
column; **area is the entire access boundary.** A machine client has no account
here, which is why routes that genuinely need an identity — `/users`,
`/prompt` — take `CurrentUser` instead and the static key can never satisfy
them.

The JWT path additionally requires `is_active` and `is_superuser`; a
non-superadmin token is rejected with `403` even though it is otherwise valid
([deps.py:76](../backend/app/api/deps.py#L76)).

---

## Scope: `area` and `page_code`

Two scopes exist, and they behave differently. Getting this right is most of
using the API correctly.

### `area` — a security boundary

- **API-key clients must send it on every call.** Omitting it is
  `400 'area' is required when authenticating with an API key`.
- **Superadmins may omit it** and then see every area at once.
- It is validated against the `area_sellers` roster; an unknown value is
  `400 Unknown area '...'`. Fetch valid values from `GET /api/v1/areas`.
- It is **fixed when the conversation is created** and can never be
  renegotiated by a later turn. `stream_chat` reads `conversation.area`, not
  anything in the request body.
- Enforcement is in SQL inside `run_sql`, not in the prompt. No instruction the
  model receives can widen it.

**Where it goes differs by route.** This trips people up:

- `POST /chat/conversations` reads `area` from the **request body** — it is the
  one call that *stores* the area rather than filtering by it.
- Every other route reads `area` from the **query string**, so reads and writes
  are filtered uniformly.

### `page_code` — a display/data filter, not a privilege

- Optional for every caller. Omit it and the conversation spans all reports.
- Validated against `sales_snapshots`, **together with the area**: a report that
  holds no rows for that area is rejected with
  `400 Report 'X' has no data for area 'Y'`. Fetch valid values from
  `GET /api/v1/reports?area=<area>`.
- Also fixed at creation and enforced in SQL for the conversation's whole life.
- On `GET /chat/conversations` it acts as a plain list filter. Unlike `area`,
  omitting it is never an escalation.

### Cross-area access returns 404, not 403

Reaching a conversation in another area gives
`404 Conversation not found` — the same response as a conversation that does not
exist. This is intentional: whether a conversation exists in an area you cannot
see is itself something you should not learn
([chat.py:85](../backend/app/api/routes/chat.py#L85)).

### What the model is told

The scope is also written into a note the agent injects as its own system
message — e.g. *"Scope: only 'North' area data is visible to you…"* — plus the
report's hand-written context when one is pinned. That keeps the model's prose
honest ("in your area, X sold most"). **It is not the enforcement.** Only the
user's own text is stored, so a reopened conversation shows the question and
nothing else.

---

## `GET /chat/models`

The only route in this router that needs no `area`.

```bash
curl -s https://your-hostname/api/v1/chat/models -H "Authorization: Bearer $TOKEN"
```

```json
{"data": ["claude-opus-4-8", "claude-fable-5"], "default": "claude-opus-4-8"}
```

`data` is default-first and deduplicated (`AI_MODEL` followed by
`AI_ALLOWED_MODELS`). Pass any of these as `model` when sending a message.

---

## `POST /chat/conversations`

```bash
curl -s -X POST https://your-hostname/api/v1/chat/conversations \
  -H "Authorization: Bearer $CHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"area": "North", "page_code": "SALES_MTD"}'
```

Body — all fields optional, but `area` is required in practice for API-key
callers:

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | `string?` (≤255) | Omit it; the first message auto-fills it |
| `area` | `string?` (≤128) | Fixes the scope permanently. Required for API-key callers |
| `page_code` | `string?` (≤50) | Pins the conversation to one report, permanently |

Response (`ConversationPublic`):

```json
{
  "id": "5f3c...9ab",
  "area": "North",
  "page_code": "SALES_MTD",
  "title": null,
  "created_at": "2026-08-13T09:12:44Z",
  "updated_at": "2026-08-13T09:12:44Z"
}
```

`title` stays `null` until the first message, which sets it to that message's
first 60 characters.

---

## `GET /chat/conversations`

```bash
curl -s "https://your-hostname/api/v1/chat/conversations?area=North&limit=20" \
  -H "Authorization: Bearer $CHAT_API_KEY"
```

| Query param | Default | Notes |
| ----------- | ------- | ----- |
| `area` | — | Required for API-key callers; a superadmin omitting it sees every area |
| `page_code` | — | Optional list filter |
| `skip` | `0` | Offset |
| `limit` | `100` | Page size |

Returns `{"data": [ConversationPublic, ...], "count": <total matching>}`, ordered
by `updated_at` descending. `count` is the total before pagination, not the
length of `data`.

---

## `POST /chat/conversations/{id}/stream`

The main endpoint. Sends one message and streams the reply as Server-Sent
Events.

```bash
curl -N -X POST \
  "https://your-hostname/api/v1/chat/conversations/$CID/stream?area=North" \
  -H "Authorization: Bearer $CHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "Which product line grew fastest last quarter?"}'
```

Body (`ChatMessageIn`):

| Field | Type | Notes |
| ----- | ---- | ----- |
| `content` | `string` (1–10 000) | Required. Empty or over-long → `422` |
| `model` | `string?` (≤100) | Optional per-message override; must be in `GET /chat/models` |

Note `?area=North` on the URL even though this is a POST — the area is a query
param on every route except conversation creation.

An unknown `model` fails with `400 Unknown model 'x'. Allowed: ...` **before the
stream opens**, because model resolution runs as a dependency. That is the point
of the design: once the SSE response has started, headers are sent and a proper
error status is no longer possible.

### Event stream

Content type is `text/event-stream`. Five event types:

| Event | Payload | Meaning |
| ----- | ------- | ------- |
| `token` | `{"text": "..."}` | A text delta. Concatenate in order |
| `tool_call` | `{"index", "id", "name", "args"}` | A **fragment** of a tool call |
| `tool_result` | `{"name", "tool_call_id", "content"}` | The tool's full result |
| `done` | `{"conversation_id": "..."}` | Completed normally |
| `error` | `{"detail": "..."}` | Failed mid-stream |

```
event: tool_call
data: {"index": 1, "id": "toolu_01A", "name": "run_sql", "args": ""}

event: tool_call
data: {"index": 1, "id": null, "name": null, "args": "{\"query\": \"SELECT"}

event: tool_call
data: {"index": 1, "id": null, "name": null, "args": " * FROM sales\"}"}

event: tool_result
data: {"name": "run_sql", "tool_call_id": "toolu_01A", "content": "{\"columns\": [...], \"rows\": [...]}"}

event: token
data: {"text": "The North region"}

event: token
data: {"text": " grew fastest"}

event: done
data: {"conversation_id": "5f3c...9ab"}
```

### Reassembling `tool_call` — key by `id`, never by `index`

Arguments arrive as fragments across many events. Only the first fragment of a
call carries `name` and `id`; the rest carry `args` only. To rebuild a call,
append `args` to the entry with the matching `id`.

**Do not key by `index`.** `index` is the position of the content block *within
one assistant message*, so it restarts at 1 on the next message of the agent
loop. Keying by it appends the second call's arguments onto the first, leaving
one entry with several concatenated queries (invalid JSON, renders as nothing)
and one orphaned result. `id` is unique for the whole run.

Pair a `tool_result` to its call via `tool_call_id`. Matching on `name` is only
a fallback for providers that omit ids.

`tool_result.content` is sent whole — `run_sql` already caps rows at
`AI_MAX_SQL_ROWS`, and truncating client-side would produce invalid JSON.

### Errors after the stream opens

A mid-stream failure cannot change the HTTP status, so it arrives as an `error`
event:

```
event: error
data: {"detail": "The assistant failed to answer. Please try again."}
```

The response stays `200` and **no `done` event follows**. Treat "stream ended
without `done`" as failure. The real exception is logged server-side.

### Side effects of a turn

- `title` is set from the first message if still empty; `updated_at` is bumped.
- Tool calls are persisted in a `finally` block — so a stream that **failed, or
  that the reader abandoned halfway, still records its queries.** Those queries
  already hit the warehouse, and that is precisely when someone wants to see
  what ran.
- Tool-call recording is bookkeeping and is guarded throughout: if the
  `chat_tool_call` table is missing or a write fails, the answer still streams
  and the failure is only logged.
- The per-process prompt cache is synced against `prompt_version` before the
  turn, so a prompt edit made on another worker is picked up within one turn.

---

## `GET /chat/conversations/{id}/messages`

```bash
curl -s "https://your-hostname/api/v1/chat/conversations/$CID/messages?area=North" \
  -H "Authorization: Bearer $CHAT_API_KEY"
```

```json
{"data": [{"role": "user", "content": "Which product line..."},
          {"role": "assistant", "content": "The North region grew fastest..."}],
 "count": 2}
```

Read from the agent's checkpoint, not a messages table. Two consequences:

- Only `user` and `assistant` **text** appears. Pure tool-call turns — an
  assistant message that only invoked `run_sql` — are skipped, so message count
  will not match the raw agent turn count.
- Tool calls and their results are **not** here. Use `/queries`.

---

## `GET /chat/conversations/{id}/queries`

Every tool call recorded for the conversation, oldest first by `sequence`.

```json
{"data": [{"name": "run_sql",
           "args": "{\"query\": \"SELECT area, SUM(amount) ...\"}",
           "result": "{\"columns\": [...], \"rows\": [...]}",
           "created_at": "2026-08-13T09:13:02Z"}],
 "count": 1}
```

This reads `chat_tool_call`, **not** the checkpoint — it is the record that
survives checkpoint pruning, so a conversation reopened much later still shows
the SQL behind its answers.

`args` and `result` are JSON **strings**, not objects; parse them client-side.
`result` is `null` for a call that never returned (e.g. the stream was
abandoned mid-query).

---

## `DELETE /chat/conversations/{id}`

```bash
curl -s -X DELETE "https://your-hostname/api/v1/chat/conversations/$CID?area=North" \
  -H "Authorization: Bearer $CHAT_API_KEY"
```

Deletes the row and the checkpointed history (`adelete_thread`). Returns
`{"message": "Conversation deleted successfully"}`.

---

## Errors

| Status | When |
| ------ | ---- |
| `400` | `area` omitted by an API-key caller |
| `400` | Unknown `area`, or a `page_code` with no rows for that area |
| `400` | `model` not in `AI_MODELS` |
| `401` | No credential at all |
| `403` | Valid JWT, but the user is not a superadmin |
| `404` | Conversation missing — **or in another area** |
| `422` | `content` empty or over 10 000 chars; malformed body |
| `503` | `ANTHROPIC_API_KEY` unset, so no agent was built at startup |

Error bodies are FastAPI's `{"detail": "..."}`. The one exception is a
mid-stream failure, which is an SSE `error` event on a `200` response.

---

## A complete flow

```bash
BASE=https://your-hostname/api/v1
AUTH="Authorization: Bearer $CHAT_API_KEY"

# 1. What can I scope to?
curl -s "$BASE/areas" -H "$AUTH"
curl -s "$BASE/reports?area=North" -H "$AUTH"

# 2. Create the conversation (area in the BODY here)
CID=$(curl -s -X POST "$BASE/chat/conversations" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"area":"North","page_code":"SALES_MTD"}' | jq -r .id)

# 3. Ask (area in the QUERY STRING from here on)
curl -N -X POST "$BASE/chat/conversations/$CID/stream?area=North" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"content":"Which product line grew fastest last quarter?"}'

# 4. Read it back
curl -s "$BASE/chat/conversations/$CID/messages?area=North" -H "$AUTH"
curl -s "$BASE/chat/conversations/$CID/queries?area=North" -H "$AUTH"
```

---

## Deployment notes

`/api/v1/chat/` has its own nginx location
([powerclaude.conf](../deploy/nginx/powerclaude.conf)) with proxy buffering
**off**. Without that the whole reply lands in one lump when the generator
finishes, instead of streaming. It also sets `limit_conn stream_conn 8`
(concurrent streams per client).

Behind Cloudflare, the 100 s first-byte limit (524) applies. The stream emits
its first event as soon as the model produces one, so a long answer is safe; a
long *silence* before the first token is not.

---

## Configuration reference

| Setting | Default | Effect |
| ------- | ------- | ------ |
| `CHAT_API_KEY` | `""` | Static bearer key for machine clients. Empty → JWT only |
| `ANTHROPIC_API_KEY` | `""` | Empty → no agent → `503` on streaming |
| `AI_MODEL` | `claude-opus-4-8` | Default model; first entry in `/chat/models` |
| `AI_ALLOWED_MODELS` | `claude-opus-4-8, claude-fable-5` | Additional selectable models |
| `AI_MAX_TOKENS` | `8192` | Per-response cap |
| `AI_MAX_SQL_ROWS` | `200` | Row cap on `run_sql` results |
| `AI_SQL_TIMEOUT_SECONDS` | `10` | Statement timeout for `run_sql` |
