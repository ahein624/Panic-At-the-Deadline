export const dynamic = "force-dynamic";

export function GET() {
  const configuredVersion: unknown = process.env.NEXT_DEPLOYMENT_ID;
  const version = typeof configuredVersion === "string" && configuredVersion ? configuredVersion : "development";
  return Response.json(
    { version },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
