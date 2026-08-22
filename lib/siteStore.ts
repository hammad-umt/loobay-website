import { randomBytes } from "node:crypto";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";

export const DOWNLOAD_PLATFORMS = ["android", "ios"] as const;

export type DownloadPlatform = (typeof DOWNLOAD_PLATFORMS)[number];

export const ISSUE_CATEGORIES = [
  "bug",
  "account",
  "download",
  "game",
  "team",
  "marketplace",
  "safety",
  "privacy",
  "feedback",
  "other",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];
export type IssueStatus = "received";

export interface DownloadCounts {
  total: number;
  android: number;
  ios: number;
}

export interface NewIssue {
  name?: string;
  email: string;
  category: IssueCategory;
  message: string;
}

export interface StoredIssue extends NewIssue {
  reference: string;
  status: IssueStatus;
  timestamp: string;
  consent: true;
}

interface SiteData {
  schemaVersion: 1;
  downloads: Record<DownloadPlatform, number>;
  issues: StoredIssue[];
}

type StoreErrorCode = "INVALID_DATA" | "COUNT_OVERFLOW";

export class SiteStoreError extends Error {
  readonly code: StoreErrorCode;

  constructor(code: StoreErrorCode, message: string) {
    super(message);
    this.name = "SiteStoreError";
    this.code = code;
  }
}

const REFERENCE_PATTERN = /^LBY-\d{8}-[A-F0-9]{8}$/;
const storeFile = path.resolve(
  /* turbopackIgnore: true */
  process.cwd(),
  process.env.LOOBAY_DATA_FILE?.trim() || "data/site-data.json",
);

let operationQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDownloadPlatform(value: unknown): value is DownloadPlatform {
  return (
    typeof value === "string" &&
    DOWNLOAD_PLATFORMS.some((platform) => platform === value)
  );
}

export function isIssueCategory(value: unknown): value is IssueCategory {
  return (
    typeof value === "string" &&
    ISSUE_CATEGORIES.some((category) => category === value)
  );
}

function isSafeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value >= 0;
}

function isValidTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    Number.isFinite(Date.parse(value))
  );
}

function isStoredIssue(value: unknown): value is StoredIssue {
  if (!isRecord(value)) {
    return false;
  }

  const validName =
    value.name === undefined ||
    (typeof value.name === "string" && value.name.length > 0 && value.name.length <= 100);

  return (
    validName &&
    typeof value.email === "string" &&
    value.email.length > 0 &&
    value.email.length <= 254 &&
    isIssueCategory(value.category) &&
    typeof value.message === "string" &&
    value.message.length >= 10 &&
    value.message.length <= 4_000 &&
    typeof value.reference === "string" &&
    REFERENCE_PATTERN.test(value.reference) &&
    value.status === "received" &&
    isValidTimestamp(value.timestamp) &&
    value.consent === true
  );
}

function parseSiteData(value: unknown): SiteData {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !isRecord(value.downloads) ||
    !isSafeCount(value.downloads.android) ||
    !isSafeCount(value.downloads.ios) ||
    value.downloads.android + value.downloads.ios > Number.MAX_SAFE_INTEGER ||
    !Array.isArray(value.issues) ||
    !value.issues.every(isStoredIssue)
  ) {
    throw new SiteStoreError(
      "INVALID_DATA",
      "The Loobay site data file does not match schema version 1.",
    );
  }

  return {
    schemaVersion: 1,
    downloads: {
      android: value.downloads.android,
      ios: value.downloads.ios,
    },
    issues: value.issues,
  };
}

function createInitialData(): SiteData {
  return {
    schemaVersion: 1,
    downloads: { android: 0, ios: 0 },
    issues: [],
  };
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function writeDataUnsafe(data: SiteData): Promise<void> {
  const directory = path.dirname(storeFile);
  const temporaryFile = `${storeFile}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  const serialized = `${JSON.stringify(data, null, 2)}\n`;

  await mkdir(directory, { recursive: true });

  let handle: Awaited<ReturnType<typeof open>> | undefined;

  try {
    handle = await open(temporaryFile, "wx", 0o600);
    await handle.writeFile(serialized, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporaryFile, storeFile);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}

async function readDataUnsafe(): Promise<SiteData> {
  try {
    const contents = await readFile(storeFile, "utf8");

    try {
      return parseSiteData(JSON.parse(contents) as unknown);
    } catch (error) {
      if (error instanceof SiteStoreError) {
        throw error;
      }

      throw new SiteStoreError(
        "INVALID_DATA",
        "The Loobay site data file contains invalid JSON.",
      );
    }
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }

    const initialData = createInitialData();
    await writeDataUnsafe(initialData);
    return initialData;
  }
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function toDownloadCounts(data: SiteData): DownloadCounts {
  const total = data.downloads.android + data.downloads.ios;

  if (!Number.isSafeInteger(total)) {
    throw new SiteStoreError("COUNT_OVERFLOW", "The download count is too large.");
  }

  return {
    total,
    android: data.downloads.android,
    ios: data.downloads.ios,
  };
}

export function assertNewIssue(issue: NewIssue): void {
  const validName =
    issue.name === undefined ||
    (typeof issue.name === "string" && issue.name.length > 0 && issue.name.length <= 100);

  if (
    !validName ||
    typeof issue.email !== "string" ||
    issue.email.length === 0 ||
    issue.email.length > 254 ||
    !isIssueCategory(issue.category) ||
    typeof issue.message !== "string" ||
    issue.message.length < 10 ||
    issue.message.length > 4_000
  ) {
    throw new TypeError("The issue payload has not been validated.");
  }
}

export function getDownloadCounts(): Promise<DownloadCounts> {
  return serialize(async () => toDownloadCounts(await readDataUnsafe()));
}

export function recordDownload(platform: DownloadPlatform): Promise<DownloadCounts> {
  return serialize(async () => {
    const data = await readDataUnsafe();

    if (data.downloads[platform] >= Number.MAX_SAFE_INTEGER) {
      throw new SiteStoreError("COUNT_OVERFLOW", "The download count is too large.");
    }

    data.downloads[platform] += 1;
    const counts = toDownloadCounts(data);
    await writeDataUnsafe(data);
    return counts;
  });
}
