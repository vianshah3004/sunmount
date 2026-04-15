import "dotenv/config";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4000";

const main = async () => {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 5);

  try {
    await fetch(`${baseUrl}/health`, { signal: ctrl.signal as any });
    console.log("Timeout probe: request returned before abort triggered.");
  } catch {
    console.log("Timeout probe: abort/timeout path triggered successfully.");
  }

  const badPayload = await fetch(`${baseUrl}/orders/v2/not-a-uuid/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toStatus: "PACKING" })
  });

  console.log("Invalid payload/status probe HTTP:", badPayload.status);
};

void main();
