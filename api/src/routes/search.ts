import type { FastifyInstance } from "fastify";
import { spawn } from "child_process";
import { existsSync } from "fs";
import type { SearchResult, Song } from "../types";

const PAGE_SIZE = 5;
const COOKIES_PATH = "/tmp/yt_cookies.txt";

interface YtDlpFlatEntry {
  id: string;
  title: string;
  channel?: string;
  uploader?: string;
  duration?: number;
  thumbnails?: { url: string; width?: number; height?: number }[];
  thumbnail?: string;
  live_status?: string;
}

function runYtDlpSearch(query: string, page: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const cookiesArgs = existsSync(COOKIES_PATH) ? ["--cookies", COOKIES_PATH] : [];
    const clientArgs = existsSync(COOKIES_PATH)
      ? ["--extractor-args", "youtube:player_client=web,tv_embedded"]
      : ["--extractor-args", "youtube:player_client=ios,android_vr"];

    // Cap at page 3 max to avoid memory spikes on free tier (512MB)
    const safePage = Math.min(page, 3);
    // Always fetch from scratch for the requested page — flat-playlist is lightweight
    const fetchCount = Math.min((safePage + 1) * PAGE_SIZE + PAGE_SIZE, 30);

    const args = [
      `ytsearch${fetchCount}:${query}`,
      "--flat-playlist",
      "--no-warnings",
      "--no-cache-dir",        // don't write cache to disk
      "--js-runtimes", "node",
      ...clientArgs,
      ...cookiesArgs,
      "-j",
    ];

    const proc = spawn("yt-dlp", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: { toString(): string }) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: { toString(): string }) => { stderr += d.toString(); });

    proc.on("close", (code: number | null) => {
      if (code === 0 || stdout.trim().length > 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`yt-dlp search failed (${code}): ${stderr.trim()}`));
      }
    });

    proc.on("error", (err: Error) => {
      reject(new Error(`yt-dlp not found: ${err.message}`));
    });
  });
}

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
      const page = Math.max(0, parseInt(request.query.page ?? "0", 10));

      try {
        const raw = await runYtDlpSearch(q, page);
        const lines = raw.split("\n").filter((l) => l.trim().startsWith("{"));

        // Parse all valid video entries
        const allVideos: Song[] = [];
        for (const line of lines) {
          try {
            const entry: YtDlpFlatEntry = JSON.parse(line);
            if (!entry.id || !entry.title) continue;
            if (entry.live_status === "is_live" || entry.live_status === "is_upcoming") continue;

            const thumbnail =
              entry.thumbnail ??
              entry.thumbnails?.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ??
              `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;

            allVideos.push({
              youtubeId: entry.id,
              title: entry.title,
              channel: entry.channel ?? entry.uploader ?? "Unknown",
              durationS: Math.round(entry.duration ?? 0),
              thumbnail,
            });
          } catch {
            // skip malformed line
          }
        }

        // Slice to the requested page
        const start = page * PAGE_SIZE;
        const pageResults = allVideos.slice(start, start + PAGE_SIZE);
        const hasNextPage = allVideos.length > start + PAGE_SIZE;

        return reply.send({
          results: pageResults,
          nextPage: hasNextPage ? String(page + 1) : null,
          prevPage: page > 0 ? String(page - 1) : null,
          page,
        } satisfies SearchResult & { prevPage: string | null; page: number });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Search failed" });
      }
    }
  );
}
