# OpenAI-compatible API

PowerClaude exposes a minimal OpenAI-shaped surface so external clients — Open
WebUI, the `openai` SDK, LiteLLM, LangChain's `ChatOpenAI`, anything that speaks
"OpenAI API" — can talk to the same agent the built-in chat UI uses.

Implementation: [openai_compat.py](../backend/app/api/routes/openai_compat.py).
Tests: [test_openai_compat.py](../backend/tests/api/routes/test_openai_compat.py).

Two endpoints are implemented. Nothing else from the OpenAI spec exists — no
embeddings, no `/v1/completions`, no function-calling passthrough, no image
input.

| Method | Path                              | Purpose                           |
| ------ | --------------------------------- | --------------------------------- |
| `GET`  | `/api/v1/openai/models`           | List selectable model ids         |
| `POST` | `/api/v1/openai/chat/completions` | Chat completion, streaming or not |

**Base URL for clients:** `https://<host>/api/v1/openai`

Note the path is `/api/v1/openai`, not `/v1`. Clients that append `/v1`
themselves need the base URL set to `https://<host>/api/v1/openai` with that
behaviour disabled, or a base of `https://<host>/api` if the client hard-codes
`/v1/chat/completions` — check what your client does before assuming.

---

## Authentication

A single static bearer token, compared in constant time against the
`CHAT_API_KEY` setting ([config.py:74](../backend/app/core/config.py#L74)):

```
Authorization: Bearer <CHAT_API_KEY>
```

This is deliberately _not_ the app's JWT flow. There is no user behind these
requests, no per-user rate limit, and no conversation ownership. Treat the key
as a shared secret with full agent access.

| Condition                    | Status | Body                                                                |
| ---------------------------- | ------ | ------------------------------------------------------------------- |
| `CHAT_API_KEY` unset (empty) | `503`  | `OpenAI-compatible API is not configured (CHAT_API_KEY is missing)` |
| Header missing or key wrong  | `401`  | `Invalid API key`                                                   |

Leaving `CHAT_API_KEY` unset is the supported way to disable these
routes entirely — they stay mounted but every call answers `503`.

Behind nginx there is an extra guard: requests with **no** `Authorization`
header at all are rejected at the edge with a `401` and an OpenAI-shaped error
body, so scanners never reach the app
([powerclaude.conf:241](../deploy/nginx/powerclaude.conf#L241)). A request with
a _wrong_ key still reaches FastAPI and gets the app's own `401`.

---

## `GET /api/v1/openai/models`

```bash
curl -s https://your-hostname/api/v1/openai/models \
  -H "Authorization: Bearer $CHAT_API_KEY"
```

```json
{
  "object": "list",
  "data": [
    {
      "id": "sales-analyst",
      "object": "model",
      "created": 1765200000,
      "owned_by": "system"
    },
    {
      "id": "claude-opus-4-8",
      "object": "model",
      "created": 1765200000,
      "owned_by": "system"
    },
    {
      "id": "claude-fable-5",
      "object": "model",
      "created": 1765200000,
      "owned_by": "system"
    }
  ]
}
```

The list is `["sales-analyst", *settings.AI_MODELS]`, where `AI_MODELS` is
`AI_MODEL` followed by `AI_ALLOWED_MODELS`, deduplicated and default-first.

- **`sales-analyst`** is an alias for whatever `AI_MODEL` currently is. Use it if
  you want the server's default and don't care which Claude model backs it.
- The concrete `claude-*` ids let a client pin a specific model.

`created` is the current wall-clock time at request time, not a real release
date — it exists because clients expect the field.

---

## `POST /api/v1/openai/chat/completions`

### Request body

```jsonc
{
  "model": "sales-analyst", // optional, defaults to "sales-analyst"
  "stream": false, // optional, defaults to false
  "messages": [
    { "role": "user", "content": "Which region grew fastest last quarter?" },
  ],
}
```

`messages[].content` accepts either a plain string or OpenAI's content-parts
array. Only parts with `"type": "text"` are read; their `text` values are
concatenated. Any other part type (image, audio, file) is silently ignored —
the agent is text-only.

```jsonc
{ "role": "user", "content": [{ "type": "text", "text": "Again" }] }
```

### Message handling — three things that differ from OpenAI

1. **`system` messages are dropped.** The agent assembles its own system prompt
   from live database structure plus the superadmin-editable prose blocks
   ([prompt.py](../backend/app/ai/prompt.py)). A client-supplied system prompt
   would compete with it, so `_to_langchain_messages` keeps only `user` and
   `assistant` turns. Sending one is not an error; it just has no effect.
2. **Empty-content messages are skipped.** A message whose extracted text is
   empty is dropped before conversion.
3. **Everything else is dropped too** — `tool`, `function`, and any unknown role
   never reach the agent.

If nothing survives that filter, the request fails with `400 No user message
provided`. A request containing only a `system` message hits exactly this.

### Statelessness

The OpenAI protocol is stateless: the client resends the whole history on every
call. These endpoints honour that.

- Nothing is written to the `Conversation` or `ChatMessage` tables.
- Each request runs on a throwaway LangGraph thread named
  `openai-compat-<uuid4>`, deleted in a `finally` block once the response
  finishes — including on error and on the streaming path.
- There is no `conversation_id` to pass and no history to fetch. If your client
  does not resend prior turns, the agent has no memory of them.

Contrast with the first-party `/api/v1/chat/*` routes, which persist
conversations per user and checkpoint history in Postgres.

### Model resolution

```
model == "sales-analyst"      → default agent (app.state.chat_agent)
model in settings.AI_MODELS   → that model's agent (app.state.chat_agents[model])
anything else                 → 404 Model '<name>' does not exist
```

Note the status code: an unknown model here is `404`, matching OpenAI, even
though the same mistake on the first-party chat route returns `400`.

### Tool calls are invisible

The agent has a guarded read-only `run_sql` tool
([tools.py](../backend/app/ai/tools.py)). It runs server-side during the
completion, but **only `AIMessageChunk` text is forwarded** to the client.
The OpenAI response carries no `tool_calls` array and the stream emits no tool
events. A client sees just the assistant's prose — including whatever SQL and
results the model chose to quote in that prose.

If you need the structured tool-call record (query text, row count, result
payload), use the first-party SSE endpoint
`/api/v1/chat/conversations/{id}/stream`, which emits `tool_call` and
`tool_result` events and persists them to `ChatToolCall`.

---

### Non-streaming response

`stream: false` (the default) buffers the whole answer and returns one JSON
object:

```json
{
  "id": "chatcmpl-6f1a...e93",
  "object": "chat.completion",
  "created": 1765200000,
  "model": "sales-analyst",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Hello world" },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

**`usage` is always zeros.** The field is present because clients expect it, but
no token accounting is done here. Do not build billing or quota logic on it.

`model` echoes back exactly what the client sent — so `"sales-analyst"` stays
`"sales-analyst"`, it is not resolved to the underlying Claude id.

`finish_reason` is always `"stop"`. There is no `length` or `content_filter`
path.

---

### Streaming response

`stream: true` returns `text/event-stream` with OpenAI's
`chat.completion.chunk` framing:

```bash
curl -N https://your-hostname/api/v1/openai/chat/completions \
  -H "Authorization: Bearer $CHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sales-analyst","stream":true,
       "messages":[{"role":"user","content":"Hi"}]}'
```

```
data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":1765200000,"model":"sales-analyst","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":1765200000,"model":"sales-analyst","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":1765200000,"model":"sales-analyst","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":1765200000,"model":"sales-analyst","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

Sequence, in order:

1. One role chunk — `delta: {"role": "assistant"}`, no content.
2. Zero or more content chunks — `delta: {"content": "..."}`. Empty text deltas
   are suppressed rather than sent as blank chunks.
3. One terminal chunk — empty `delta`, `finish_reason: "stop"`.
4. The literal line `data: [DONE]`.

`id` and `created` are identical across every chunk of one response.

---

## Errors

| Status | When                                                      | Shape                                                                                            |
| ------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `401`  | Missing/invalid bearer key (nginx or app)                 | FastAPI `{"detail": ...}`, or nginx's OpenAI-shaped `{"error": {...}}` for a fully absent header |
| `400`  | No usable `user`/`assistant` message after filtering      | `{"detail": "No user message provided"}`                                                         |
| `404`  | `model` is not `sales-analyst` and not in `AI_MODELS`     | `{"detail": "Model 'gpt-4' does not exist"}`                                                     |
| `422`  | Malformed body (e.g. `messages` missing)                  | FastAPI validation error                                                                         |
| `503`  | `CHAT_API_KEY` unset                                      | `{"detail": "OpenAI-compatible API is not configured ..."}`                                      |
| `503`  | `ANTHROPIC_API_KEY` unset — no agent was built at startup | `{"detail": "Chat is not configured (ANTHROPIC_API_KEY is missing)"}`                            |
| `502`  | Agent raised mid-completion, **non-streaming only**       | `{"detail": "The assistant failed to answer."}`                                                  |

Error bodies use FastAPI's `{"detail": "..."}`, **not** OpenAI's
`{"error": {"message": ..., "type": ...}}`. Clients that parse the OpenAI error
envelope will fall back to a generic message. This is a known deviation.

### Streaming failures do not change the status code

Once the stream has started, headers are already sent, so a mid-stream agent
failure cannot become a `502`. Instead the generator emits a normal content
chunk containing:

```
\n\n[The assistant failed to answer. Please try again.]
```

then the usual `finish_reason: "stop"` chunk and `[DONE]`. The HTTP status
stays `200`. **A streaming client must treat this sentinel text as a failure
signal** — there is no other indication. The throwaway thread is still deleted,
and the real exception is logged server-side.

---

## Client setup

### `openai` Python SDK

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://your-hostname/api/v1/openai",
    api_key="<CHAT_API_KEY>",
)

resp = client.chat.completions.create(
    model="sales-analyst",
    messages=[{"role": "user", "content": "Which region grew fastest last quarter?"}],
)
print(resp.choices[0].message.content)
```

Streaming:

```python
stream = client.chat.completions.create(
    model="sales-analyst",
    messages=[{"role": "user", "content": "Summarise Q3 by product line."}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")
```

Remember: the SDK keeps no history for you. Append each assistant reply to
`messages` yourself if you want a multi-turn conversation.
