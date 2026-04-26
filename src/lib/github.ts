export interface GhUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  pushed_at: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
}

export interface GhRepoDetails extends GhRepo {
  open_issues_count: number;
  default_branch: string;
}

export interface GhCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
}

const BASE = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function call<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: headers(token) });
  if (!res.ok) {
    let msg = `GitHub ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) msg = `GitHub: ${body.message}`;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function ghMe(token: string) {
  return call<GhUser>(`${BASE}/user`, token);
}

export async function ghListRepos(token: string) {
  return call<GhRepo[]>(
    `${BASE}/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member`,
    token
  );
}

export async function ghRepoCommits(
  token: string,
  repoFullName: string,
  perPage = 10
) {
  return call<GhCommit[]>(
    `${BASE}/repos/${repoFullName}/commits?per_page=${perPage}`,
    token
  );
}

export async function ghRepoInfo(token: string, repoFullName: string) {
  return call<GhRepoDetails>(`${BASE}/repos/${repoFullName}`, token);
}

export async function ghRepoCommitsSince(
  token: string,
  repoFullName: string,
  sinceISO: string,
  author?: string
) {
  // Optional `author` filter uses GitHub's author=username param — note that
  // GitHub only matches commits whose email is verified on the user's account.
  // Leave author undefined to count every commit on the repo, which is usually
  // what you want for a linked personal project.
  const authorPart = author
    ? `author=${encodeURIComponent(author)}&`
    : "";
  return call<GhCommit[]>(
    `${BASE}/repos/${repoFullName}/commits?${authorPart}since=${encodeURIComponent(
      sinceISO
    )}&per_page=100`,
    token
  );
}

export function parseGithubRepo(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^\/]+\/[^\/?#]+)/i);
  return m ? m[1].replace(/\.git$/, "") : null;
}
