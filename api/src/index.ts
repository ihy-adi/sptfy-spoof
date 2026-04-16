import Fastify from "fastify";
import cors from "@fastify/cors";
import { searchRoutes } from "./routes/search";
import { streamRoutes } from "./routes/stream";

const server = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

async function start() {
  await server.register(cors, {
    origin: true, // personal use — allow all origins
    methods: ["GET"],
  });

  // Health
  server.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));

  // Routes
  await server.register(searchRoutes);
  await server.register(streamRoutes);

  const port = parseInt(process.env.PORT ?? "3000", 10);
  const host = process.env.HOST ?? "0.0.0.0";

  await server.listen({ port, host });
  console.log(`\n🎵  sptfy-api running at http://${host}:${port}\n`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
