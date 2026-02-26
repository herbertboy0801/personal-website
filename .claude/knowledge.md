# Knowledge Base - herbert-ai-website

## Vercel Hobby Plan Constraints
- Max 12 serverless functions per deployment
- Each .js file under api/ counts as 1 function
- Files in api/lib/ ALSO count (even if not handlers)
- Solution: keep shared code in root-level lib/, merge endpoints

## Vercel Serverless Function Patterns
- `"framework": null` for non-framework static sites
- Don't specify runtime version (auto-detected)
- Use vercel.json rewrites for sub-routes: `/api/blog/:id` -> `/api/blog?id=:id`
- Query params via `req.query.id` and `req.query.action`

## Turso / libSQL
- .env.local NOT auto-loaded by standalone Node scripts
- Need manual env parser (readFileSync + split + indexOf)
- `vercel dev` DOES auto-load .env.local

## Admin Panel Architecture
- SPA in admin/public/ (script.js ~2048 lines)
- Uses fetch to /api/* endpoints
- JWT httpOnly cookie auth (transparent to frontend)
- API paths: blog, tools, gallery, works, journal, journal-settings
- Auth paths: /api/login, /api/logout, /api/auth-status, /api/change-password
  (all rewritten to /api/auth?action=xxx)
