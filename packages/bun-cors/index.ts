type Handler = (req: Request) => Promise<Response>;

interface CorsOptions {
	origin?: (string | RegExp)[] | string;
	methods?: string[];
	headers?: string[];
	maxAge?: number;
	credentials?: boolean;
}

const defaultOptions: Required<CorsOptions> = {
	credentials: false,
	headers: ["Content-Type", "Authorization"],
	maxAge: 3600,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	origin: "*",
};
function isOriginAllowed(
	requestOrigin: string,
	allowedOrigins: (string | RegExp)[],
): boolean {
	console.log(`Checking if origin '${requestOrigin}' is allowed`);

	for (const origin of allowedOrigins) {
		if (origin instanceof RegExp) {
			const matches = origin.test(requestOrigin);
			console.log(
				`  - Testing against RegExp '${origin}': ${matches ? "MATCH" : "no match"}`,
			);
			if (matches) {
				return true;
			}
		} else if (origin === requestOrigin) {
			console.log(`  - Exact match with '${origin}'`);
			return true;
		} else {
			console.log(`  - No match with '${origin}'`);
		}
	}
	return false;
}

function mergeCorsOptions(options: CorsOptions): Required<CorsOptions> {
	return {
		...defaultOptions,
		...options,
	};
}

function createCorsHeaders(
	req: Request,
	options: Required<CorsOptions>,
): Headers {
	const headers = new Headers();
	const requestOrigin = req.headers.get("origin");

	// Handle origin
	if (requestOrigin) {
		console.log(`Incoming request from origin: '${requestOrigin}'`);

		const allowedOrigins = Array.isArray(options.origin)
			? options.origin
			: [options.origin];

		console.log(
			"Allowed origins config:",
			allowedOrigins.map((o) => (o instanceof RegExp ? o.toString() : o)),
		);

		if (options.origin === "*") {
			console.log("Wildcard origin (*) configured - allowing all origins");
			headers.set("Access-Control-Allow-Origin", "*");
		} else if (isOriginAllowed(requestOrigin, allowedOrigins)) {
			console.log(`Origin '${requestOrigin}' is allowed - setting ACAO header`);
			headers.set("Access-Control-Allow-Origin", requestOrigin);
		} else {
			console.warn(
				`Origin '${requestOrigin}' is not allowed - CORS will block the request`,
			);
		}
	} else {
		console.log("No origin header in request");
	}

	// Set other CORS headers
	headers.set("Access-Control-Allow-Methods", options.methods.join(", "));
	headers.set("Access-Control-Allow-Headers", options.headers.join(", "));
	headers.set("Access-Control-Max-Age", options.maxAge.toString());

	if (options.credentials) {
		headers.set("Access-Control-Allow-Credentials", "true");
		// When credentials are true, we can't use wildcard
		if (headers.get("Access-Control-Allow-Origin") === "*") {
			headers.set("Access-Control-Allow-Origin", requestOrigin || "");
		}
	}

	return headers;
}

/**
 * CORS middleware for Bun server
 * @param handler - Request handler function
 * @param options - CORS configuration options
 */
export function cors(handler: Handler, options: CorsOptions = {}) {
	const mergedOptions = mergeCorsOptions(options);
	return async (req: Request): Promise<Response> => {
		const corsHeaders = createCorsHeaders(req, mergedOptions);

		// Handle preflight requests
		if (req.method === "OPTIONS") {
			return new Response(null, {
				headers: corsHeaders,
				status: 204,
			});
		}

		// Handle actual request
		const response = await handler(req);
		const headers = new Headers(response.headers);

		// Add CORS headers to response
		for (const [key, value] of corsHeaders.entries()) {
			headers.set(key, value);
		}

		return new Response(response.body, {
			headers,
			status: response.status,
			statusText: response.statusText,
		});
	};
}
