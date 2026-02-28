# PROJECT STATUS - herbert-ai-website

## Current Phase: Complete (Phase 0-5 Done)

## Migration Progress (L-size task)

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| Phase 0 | Project setup (package.json, vercel.json, .env.local) | DONE | 2026-02-25 |
| Phase 1 | DB schema + data migration (7 tables, Turso) | DONE | 2026-02-25 |
| Phase 2 | Serverless API functions (merged to 7) | DONE | 2026-02-26 |
| Phase 3 | Frontend data loading refactor (fetch API) | DONE | 2026-02-25 |
| Phase 4 | Visual refresh (CSS variables + animations) | DONE | 2026-02-28 |
| Phase 5 | Integration testing + cleanup | DONE | 2026-02-28 |

## Deployment

- **URL**: https://personal-website-lac-omega-21.vercel.app/
- **GitHub**: https://github.com/herbertboy0801/personal-website
- **Database**: Turso (libsql://herbert-ai-website-herbertboy0801.aws-ap-northeast-1.turso.io)

## Verified API Endpoints (2026-02-28)

- GET /api/blog -> 23 articles (5 with real links, 18 placeholder "#")
- GET /api/tools -> 25 tools
- GET /api/gallery -> 22 gallery items
- GET /api/works -> 4 featured works
- GET /api/journal -> 7 journal entries
- GET /api/journal-settings -> settings OK
- GET /api/auth?action=status -> auth system OK
- POST/PUT/DELETE without auth -> correctly rejected ("请先登录")

## Key Decisions

- api/lib/ moved to lib/ (avoid Vercel counting as functions)
- 4 auth endpoints merged into api/auth.js (query param routing)
- 5 resource endpoints each handle GET/POST/PUT/DELETE (vercel.json rewrites)
- Total: 7 serverless functions (under Hobby plan 12 limit)

## TODO

- [x] Phase 4: CSS variables system (:root variables for colors, spacing, radius) ✓
- [x] Phase 4: Inline styles extracted to style.css (blog/tools/gallery/404) ✓
- [x] Phase 4: morning-journal-view.css hardcoded hex → CSS variables ✓
- [x] Phase 4: Visual enhancements (pageIn, focus-visible, scrollbar, selection) ✓
- [x] Phase 5: API endpoints verified (7 GET + auth protection on write ops) ✓
- [x] Phase 5: Mobile responsive verified (1440/768/375px, 18 screenshots) ✓
- [x] Phase 5: Accessibility audit + fixes (aria-label, heading hierarchy) ✓
- [x] Security: .env.local already in .gitignore ✓
- [x] Admin password: CHANGED (2026-02-26) ✓
- [ ] Blog article links: 18/23 still "#" (needs manual update via admin)
- [ ] Legacy admin/*.js data files: kept for migrate script reproducibility
