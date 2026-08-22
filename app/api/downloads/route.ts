import {
  getDownloadCounts,
  isDownloadPlatform,
  recordDownload,
  type DownloadPlatform,
} from "@/lib/siteStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

function configuredUrl(platform: DownloadPlatform): string | undefined {
  const raw =
    platform === "android"
      ? process.env.ANDROID_APP_URL?.trim()
      : process.env.IOS_APP_URL?.trim();

  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(): Promise<Response> {
  try {
    const downloads = await getDownloadCounts();

    return json({
      downloads,
      availability: {
        android: configuredUrl("android") !== undefined,
        ios: configuredUrl("ios") !== undefined,
      },
    });
  } catch (error) {
    console.error("[downloads] Unable to read download statistics.", error);
    return json(
      { ok: false, message: "Download statistics are temporarily unavailable." },
      500,
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > 1_024) {
    return json({ ok: false, message: "The request is too large." }, 413);
  }

  let body: unknown;

  try {
    const text = await request.text();

    if (Buffer.byteLength(text, "utf8") > 1_024) {
      return json({ ok: false, message: "The request is too large." }, 413);
    }

    body = JSON.parse(text) as unknown;
  } catch {
    return json({ ok: false, message: "Send a valid JSON request." }, 400);
  }

  const platform =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).platform
      : undefined;

  if (!isDownloadPlatform(platform)) {
    return json(
      {
        ok: false,
        message: "Choose Android or iOS.",
        fieldErrors: { platform: "Platform must be android or ios." },
      },
      400,
    );
  }

  const url = configuredUrl(platform);

  if (!url) {
    const platformName = platform === "android" ? "Android" : "iOS";
    return json(
      {
        ok: false,
        code: "DOWNLOAD_NOT_CONFIGURED",
        message: `${platformName} download is not available yet.`,
      },
      503,
    );
  }

  try {
    const downloads = await recordDownload(platform);

    return json({
      ok: true,
      platform,
      count: downloads[platform],
      total: downloads.total,
      url,
    });
  } catch (error) {
    console.error("[downloads] Unable to record a download.", error);
    return json(
      { ok: false, message: "The download could not be started. Please try again." },
      500,
    );
  }
}
