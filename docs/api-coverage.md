# API Coverage Map

## Projects
- `GET /api/projects` -> `server/api/projects/index.get.ts`
- `POST /api/projects` -> `server/api/projects/index.post.ts`
- `GET /api/projects/:id` -> `server/api/projects/[id].get.ts`
- `PATCH /api/projects/:id` -> `server/api/projects/[id].patch.ts`
- `DELETE /api/projects/:id` -> `server/api/projects/[id].delete.ts`
- `GET /api/projects/:id/members` -> `server/api/projects/[id]/members/index.get.ts`
- `POST /api/projects/:id/members` -> `server/api/projects/[id]/members/index.post.ts`
- `PATCH /api/projects/:id/members/:uid` -> `server/api/projects/[id]/members/[uid].patch.ts`
- `DELETE /api/projects/:id/members/:uid` -> `server/api/projects/[id]/members/[uid].delete.ts`

## Documents
- `GET /api/projects/:pid/documents` -> `server/api/projects/[pid]/documents/index.get.ts`
- `POST /api/projects/:pid/documents` -> `server/api/projects/[pid]/documents/index.post.ts`
- `GET /api/documents/:id` -> `server/api/documents/[id].get.ts`
- `PATCH /api/documents/:id` -> `server/api/documents/[id].patch.ts`
- `DELETE /api/documents/:id` -> `server/api/documents/[id].delete.ts`
- `GET /api/documents/:id/content` -> `server/api/documents/[id]/content.get.ts`
- `PUT /api/documents/:id/content` -> `server/api/documents/[id]/content.put.ts`

## Tasks
- `GET /api/projects/:pid/tasks` -> `server/api/projects/[pid]/tasks/index.get.ts`
- `POST /api/projects/:pid/tasks` -> `server/api/projects/[pid]/tasks/index.post.ts`
- `GET /api/tasks/:id` -> `server/api/tasks/[id].get.ts`
- `PATCH /api/tasks/:id` -> `server/api/tasks/[id].patch.ts`
- `DELETE /api/tasks/:id` -> `server/api/tasks/[id].delete.ts`
- `POST /api/projects/:pid/tasks/bulk` -> `server/api/projects/[pid]/tasks/bulk.post.ts`

## Comments
- `GET /api/comments` -> `server/api/comments/index.get.ts`
- `POST /api/comments` -> `server/api/comments/index.post.ts`
- `PATCH /api/comments/:id` -> `server/api/comments/[id].patch.ts`
- `DELETE /api/comments/:id` -> `server/api/comments/[id].delete.ts`
- `POST /api/comments/:id/resolve` -> `server/api/comments/[id]/resolve.post.ts`

## Notifications
- `GET /api/notifications` -> `server/api/notifications/index.get.ts`
- `PATCH /api/notifications/:id/read` -> `server/api/notifications/[id]/read.patch.ts`
- `POST /api/notifications/read-all` -> `server/api/notifications/read-all.post.ts`

## Search / Activity / AI
- `GET /api/search` -> `server/api/search/index.get.ts`
- `GET /api/projects/:pid/activity` -> `server/api/projects/[pid]/activity.get.ts`
- `GET /api/activity` -> `server/api/activity/index.get.ts`
- `POST /api/ai/chat` -> `server/api/ai/chat.post.ts`

## Auth
- `GET /api/auth/session` -> `server/api/auth/session.get.ts`
- `POST /api/auth/login` -> `server/api/auth/login.post.ts`
- `POST /api/auth/signup` -> `server/api/auth/signup.post.ts`
- `POST /api/auth/logout` -> `server/api/auth/logout.post.ts`
- `POST /api/auth/switch-org` -> `server/api/auth/switch-org.post.ts`

## Organizations
- `GET /api/orgs` -> `server/api/orgs/index.get.ts`
- `POST /api/orgs` -> `server/api/orgs/index.post.ts`
- `GET /api/orgs/:id/members` -> `server/api/orgs/[id]/members/index.get.ts`
- `PATCH /api/orgs/:id/members/:uid` -> `server/api/orgs/[id]/members/[uid].patch.ts`
