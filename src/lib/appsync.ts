const ENDPOINT = import.meta.env.VITE_APPSYNC_ENDPOINT as string | undefined;
const API_KEY = import.meta.env.VITE_APPSYNC_API_KEY as string | undefined;

if (!ENDPOINT || !API_KEY) {
  throw new Error(
    "VITE_APPSYNC_ENDPOINT と VITE_APPSYNC_API_KEY を .env.local に設定してください",
  );
}

// ─── HTTP GraphQL クライアント ────────────────────────────────────────

interface GqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(ENDPOINT!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL request failed: HTTP ${res.status}`);
  }
  const json: GqlResponse<T> = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (json.data == null) {
    throw new Error("GraphQL response contained no data");
  }
  return json.data;
}

// ─── WebSocket サブスクリプション ─────────────────────────────────────

/**
 * AppSync リアルタイムサブスクリプションを開始する。
 * @returns 購読を停止するクリーンアップ関数
 */
export function subscribe(
  query: string,
  onData: (data: Record<string, unknown>) => void,
  onError?: (payload: unknown) => void,
): () => void {
  // HTTP エンドポイント → WebSocket エンドポイントに変換
  const realtimeEndpoint = ENDPOINT!.replace("https://", "wss://").replace(
    ".appsync-api.",
    ".appsync-realtime-api.",
  );

  const host = new URL(ENDPOINT!).host;
  const header = btoa(JSON.stringify({ host, "x-api-key": API_KEY! }));
  const payload = btoa("{}");

  const wsUrl = new URL(realtimeEndpoint);
  wsUrl.searchParams.set("header", header);
  wsUrl.searchParams.set("payload", payload);
  const ws = new WebSocket(wsUrl.toString(), "graphql-ws");

  const subId = crypto.randomUUID();
  let closed = false;

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "connection_init" }));
  };

  ws.onmessage = (event: MessageEvent<string>) => {
    let msg: {
      type: string;
      id?: string;
      payload?: { data?: Record<string, unknown> };
    };
    try {
      msg = JSON.parse(event.data) as typeof msg;
    } catch {
      console.error("[AppSync] Failed to parse message:", event.data);
      return;
    }

    switch (msg.type) {
      case "connection_ack":
        ws.send(
          JSON.stringify({
            id: subId,
            type: "start",
            payload: {
              data: JSON.stringify({ query }),
              extensions: {
                authorization: { host, "x-api-key": API_KEY },
              },
            },
          }),
        );
        break;
      case "data":
        if (msg.id === subId && msg.payload?.data) {
          onData(msg.payload.data);
        }
        break;
      case "ka":
        break; // keep-alive: 無視
      case "error":
        console.error("[AppSync] Subscription error:", msg.id, msg.payload);
        onError?.(msg.payload);
        closed = true;
        ws.close();
        break;
      case "connection_error":
        console.error("[AppSync] Connection error:", msg.payload);
        closed = true; // onclose を「予期しない切断」として扱わないようにフラグを立てる
        ws.close();
        break;
    }
  };

  ws.onerror = (event) => {
    console.error("[AppSync] WebSocket error:", event);
  };

  ws.onclose = (event) => {
    if (!closed) {
      console.warn(
        "[AppSync] WebSocket closed unexpectedly:",
        event.code,
        event.reason,
      );
    }
  };

  return () => {
    if (closed) return;
    closed = true;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: subId, type: "stop" }));
      ws.close();
    } else {
      ws.close();
    }
  };
}
