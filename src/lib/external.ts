/** Hosted repository. Used for "Open an issue" links; following a link is always the user's choice. */
export const REPO_URL = 'https://github.com/atuuuuuuu/unpacked'

export function newIssueUrl(template: string, title: string) {
  const q = new URLSearchParams({ template, title })
  return `${REPO_URL}/issues/new?${q}`
}
