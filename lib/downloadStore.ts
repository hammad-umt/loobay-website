import "server-only";

import { getSupabaseAdmin } from "@/lib/issueStore";
import type { DownloadCounts, DownloadPlatform } from "@/lib/siteStore";

type DownloadCountRow = {
  platform: DownloadPlatform;
  count: number;
};

function toDownloadCounts(rows: DownloadCountRow[]): DownloadCounts {
  const android = rows.find((row) => row.platform === "android")?.count ?? 0;
  const ios = rows.find((row) => row.platform === "ios")?.count ?? 0;

  return { android, ios, total: android + ios };
}

export async function getDownloadCounts(): Promise<DownloadCounts> {
  const { data, error } = await getSupabaseAdmin()
    .from("download_counts")
    .select("platform, count");

  if (error) throw error;
  return toDownloadCounts(data as DownloadCountRow[]);
}

export async function recordDownload(platform: DownloadPlatform): Promise<DownloadCounts> {
  const { error } = await getSupabaseAdmin().rpc("increment_download_count", {
    target_platform: platform,
  });

  if (error) throw error;
  return getDownloadCounts();
}