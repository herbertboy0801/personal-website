# PROJECT STATUS - herbert-ai-website

## Current Phase: Phase 4 (Visual Refresh) Pending

## Migration Progress (L-size task)

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| Phase 0 | Project setup (package.json, vercel.json, .env.local) | DONE | 2026-02-25 |
| Phase 1 | DB schema + data migration (7 tables, Turso) | DONE | 2026-02-25 |
| Phase 2 | Serverless API functions (merged to 7) | DONE | 2026-02-26 |
| Phase 3 | Frontend data loading refactor (fetch API) | DONE | 2026-02-25 |
| Phase 4 | Visual refresh (CSS variables + animations) | TODO | - |
| Phase 5 | Integration testing + cleanup | PARTIAL | 2026-02-26 |

## Deployment

- **URL**: https://personal-website-46pb.vercel.app/
- **GitHub**: https://github.com/herbertboy0801/personal-website
- **Database**: Turso (libsql://herbert-ai-website-herbertboy0801.aws-ap-northeast-1.turso.io)

## Verified API Endpoints (2026-02-26)

- GET /api/blog -> 26 articles
- GET /api/tools -> 24 tools
- GET /api/gallery -> 22 gallery items
- GET /api/works -> 4 featured works
- GET /api/journal -> 7 journal entries
- GET /api/journal-settings -> settings OK
- GET /api/auth?action=status -> auth system OK

## Key Decisions

- api/lib/ moved to lib/ (avoid Vercel counting as functions)
- 4 auth endpoints merged into api/auth.js (query param routing)
- 5 resource endpoints each handle GET/POST/PUT/DELETE (vercel.json rewrites)
- Total: 7 serverless functions (under Hobby plan 12 limit)

## TODO

- [ ] Phase 4: CSS variables system (:root variables for colors, spacing, radius)
- [ ] Phase 4: Enhanced glassmorphism nav, card hover effects, hero animations
- [ ] Phase 4: Loading skeleton shimmer, mobile menu animation
- [ ] Phase 4: Font optimization (Inter / Noto Sans SC)
- [ ] Phase 5: Admin CRUD full test (all 6 data types)
- [ ] Phase 5: Mobile responsive verification (1440/768/375px)
- [ ] Phase 5: Lighthouse audit (Performance >90, Accessibility >90)
- [ ] Blog article links: most still "#", need to add real URLs via admin
- [ ] Cleanup: remove legacy admin/*.js data files
- [ ] Security: add .env.local to .gitignore
- [ ] Admin password: CHANGED (2026-02-26)
