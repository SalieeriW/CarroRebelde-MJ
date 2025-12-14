export async function sendMinigameResult({ serverUrl, roomCode, won }) {
  const res = await fetch(`${serverUrl}/minigame/result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, won }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data; // { success:true, result:"won"|"lost" }
}
