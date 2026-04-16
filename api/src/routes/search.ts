import type { FastifyInstance } from "fastify";
import ytsr from "@distube/ytsr";
import type { SearchResult, Song } from "../types";

const RESULTS_PER_PAGE = 5;

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: { q: string; page?: string };
  }>(
    "/search",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: { type: "string", minLength: 1 },
            page: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { q } = request.query;

      try {
        // Fetch enough to fill 5 non-live, non-upcoming videos
        const raw = await ytsr(q, { limit: 20 });

        const videos: Song[] = [];
        for (const item of raw.items) {
          if (item.type !== "video") continue;
          if (item.isLive || item.isUpcoming) continue;
          if (videos.length >= RESULTS_PER_PAGE) break;

          videos.push({
            youtubeId: item.id,
            title: item.name,
            channel: item.author?.name ?? "Unknown",
            durationS: parseDuration(item.duration ?? "0:00"),
            thumbnail:
              item.thumbnail ??
              `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          });
        }

        const result: SearchResult = {
          results: videos,
          nextPage: null, // pagination handled via fresh queries for Phase 1
        };

        return reply.send(result);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Search failed" });
      }
    }
  );
}

function parseDuration(raw: string): number {
  if (!raw) return 0;
  const parts = raw.split(":").map(Number).reverse();
  return (parts[2] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[0] ?? 0);
}
