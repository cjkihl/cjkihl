import { cors } from "../index.pub.ts";

const PORT = process.env.PORT || 4000;

Bun.serve({
	fetch: cors(
		async (req) => {
			return new Response(`OK_${req.method}`, { status: 200 });
		},
		{
			headers: ["Content-Type", "Authorization"],
			methods: ["GET", "POST"],
			origin: ["*"],
		},
	),
	port: PORT,
});
