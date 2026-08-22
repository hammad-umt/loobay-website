import { listIssues, type IssueStoreError } from "@/lib/issueStore";
import { isAdminSession } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
}

function response(body: string, status = 200, headers: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      ...headers,
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  if (!isAdminSession(request)) {
    return Response.redirect(new URL("/admin/login", request.url), 303);
  }

  try {
    const issues = await listIssues();
    const rows = issues
      .map(
        (issue) => `<tr>
          <td><strong>${escapeHtml(issue.reference)}</strong><small>${escapeHtml(new Date(issue.created_at).toLocaleString())}</small></td>
          <td>${escapeHtml(issue.name ?? "-")}<small>${escapeHtml(issue.email)}</small></td>
          <td>${escapeHtml(issue.category)}</td>
          <td>${escapeHtml(issue.status)}</td>
          <td class="message">${escapeHtml(issue.message)}</td>
        </tr>`,
      )
      .join("");

    return response(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Loobay issue reports</title>
          <style>
            :root { color-scheme: light; font-family: system-ui, sans-serif; color: #1c1b21; background: #f8f8fa; }
            body { margin: 0; padding: 32px; }
            main { max-width: 1400px; margin: 0 auto; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            p { color: #697281; }
            .table-wrap { overflow-x: auto; background: #fff; border: 1px solid #e8e8ed; border-radius: 12px; }
            table { width: 100%; min-width: 900px; border-collapse: collapse; text-align: left; }
            th, td { padding: 14px 16px; border-bottom: 1px solid #e8e8ed; vertical-align: top; }
            th { background: #f4e8ff; color: #513e66; font-size: 12px; text-transform: uppercase; }
            tr:last-child td { border-bottom: 0; }
            small { display: block; margin-top: 5px; color: #697281; }
            .message { max-width: 520px; white-space: pre-wrap; }
          </style>
        </head>
        <body><main><h1>Issue reports</h1><p>Showing ${issues.length} most recent report${issues.length === 1 ? "" : "s"}.</p>
          <div class="table-wrap"><table><thead><tr><th>Reference</th><th>Reporter</th><th>Category</th><th>Status</th><th>Message</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No issue reports yet.</td></tr>'}</tbody></table></div>
        </main></body>
      </html>`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load issue reports.";
    console.error("[admin/issues] Unable to load issue reports.", error as IssueStoreError);
    return response(`<h1>Unable to load issue reports</h1><p>${escapeHtml(message)}</p>`, 500);
  }
}