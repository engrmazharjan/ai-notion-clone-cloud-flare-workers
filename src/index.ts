/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export default {
// 	async fetch(request, env, ctx): Promise<Response> {
// 		return new Response('Hello World!');
// 	},
// } satisfies ExportedHandler<Env>;

import OpenAI from "openai";
import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
	OPEN_AI_KEY: string;
	AI: Ai;
}
const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors({
	origin: "*", // Allow requests from your Next.js app
	allowHeaders: ["X-Custom-Headers", "Upgrade-Insecure-Requests", "Content-Type"], // Add Content-Type to the allowed headers to fix CORS
	allowMethods: ["GET", "POST", "OPTIONS", "PUT"],
	exposeHeaders: ["Content-length", "X-Kuma-Revision"],
	maxAge: 600,
	credentials: true,
}));

app.post("/translateDocument", async (c) => {
	const { documentData, targetLang } = await c.req.json();
	// * Generate a summary of the document
	const summaryResponse = await c.env.AI.run("@cf/facebook/bart-large-cnn", {
		input_text: documentData,
		max_length: 1000
	});

	// * Translate the summary into another language

	const response = await c.env.AI.run("@cf/meta/m2m100-1.2b", {
		text: summaryResponse.summary,
		source_lang: "english",
		target_lang: targetLang
	});

	return new Response(JSON.stringify(response));
});

export default app;
