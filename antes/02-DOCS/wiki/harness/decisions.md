# Harness decisions

- Accepted plan `8e582679db6edf91ef1176849615d452964545f47434e6e7219315e368c6b602`.
- Project kind: software.
- SDD: selected.
- 2026-10-30: In this nested checkout, Codex hooks resolve their scripts under
  `<git-root>/antes/.rsc/` and set `RSC_PROJECT_CWD=<git-root>/antes`.
  This is the minimal route correction; the Git repository is not moved.
