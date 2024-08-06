import type { APIRoute } from "astro"

const HONO_API_URL = "http://localhost:3000"; // Replace with your Hono API URL

export const ALL: APIRoute = async ({ request, params }) => {
    const route = params.route;
    const url = new URL(request.url);
    console.log(url)

    // Construct the target URL
    const targetUrl = `${HONO_API_URL}/${route}${url.search}`;
    
    console.log("targetUrl")
    console.log(targetUrl)

    // Forward the request to the Hono API
    const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        credentials: 'include',
        ...( { duplex: 'half' } as RequestInit ), // Add this line to resolve the error
    });

    // Extract cookies from the response
    const cookies = response.headers.get('set-cookie');

    // Create a new response
    const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });

    // If there are cookies, add them to the new response
    if (cookies) {
        newResponse.headers.set('Set-Cookie', cookies);
    }

    return newResponse;
}