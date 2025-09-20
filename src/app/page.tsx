export default async function Home() {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
  let status = "unreachable";
  try {
    const r = await fetch(`${api}/health`, { cache: "no-store" });
    status = (await r.json()).ok ? "api ok" : "api not ok";
  } catch {}
  return <main style={{padding:20}}>Hello DNA Monsters — {status}</main>;
}
