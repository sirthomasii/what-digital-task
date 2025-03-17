This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_API_URL`: The base URL for the API. Defaults to `http://localhost:8000/api` in development.

You can set these variables in a `.env.local` file in the root of the project:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

In production, the application uses relative URLs (`/api/`) to avoid CORS issues. This ensures that API requests are sent to the same domain as the frontend, which is then proxied by Nginx to the backend service.

> **Note:** When working with the Django backend, all API endpoints must include trailing slashes. The `getApiUrl` helper function in `src/utils/config.ts` automatically adds these trailing slashes to ensure compatibility with Django's URL routing.

## Troubleshooting

If you encounter API errors in production:

1. Check browser console for detailed error messages (the application includes extensive logging)
2. Verify that the backend API is accessible at the expected URL
3. Ensure CORS headers are properly configured on the backend
4. Check that all API endpoints include trailing slashes (Django requirement)
5. Ensure that the Nginx configuration is correctly proxying requests from `/api/` to the backend service

### Common Issues

- **502 Bad Gateway**: This typically indicates that Nginx cannot reach the backend service. Check that:
  - The Django backend is running on the expected port (8000)
  - Nginx is configured to proxy requests to the correct address (`proxy_pass http://127.0.0.1:8000;`)
  - There are no network issues between Nginx and the backend

- **CORS Errors**: If you see CORS-related errors in the console, ensure that:
  - You're using relative URLs in production (`/api/`) rather than absolute URLs
  - The backend is configured to allow requests from the frontend domain
  - Credentials are included in the requests (`credentials: 'include'`)

- **Authentication Errors**: If you can't log in, check that:
  - The token validation endpoint is working correctly
  - The backend is correctly validating the token
  - The token is being stored correctly in localStorage
