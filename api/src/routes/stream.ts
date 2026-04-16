import type { FastifyInstance } from "fastify";
import { spawn } from "child_process";
import type { StreamResult } from "../types";

// Brief in-memory cache — yt-dlp URLs last ~6h from YouTube
const streamCache = new Map<string, { data: StreamResult; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (conservative)

interface YtDlpJson {
  id: string;
  title: string;
  duration: number;        // seconds
  thumbnail: string;
  url: string;             // direct stream URL for selected format
  ext: string;
  abr?: number;            // audio bitrate
}

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: { toString(): string }) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: { toString(): string }) => { stderr += d.toString(); });

    proc.on("close", (code: number | null) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`yt-dlp exited ${code}: ${stderr.trim()}`));
      }
    });

    proc.on("error", (err: Error) => {
      reject(new Error(`yt-dlp not found. Run: brew install yt-dlp\n${err.message}`));
    });
  });
}

export async function streamRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { videoId: string } }>(
    "/stream/:videoId",
    {
      schema: {
        params: {
          type: "object",
          required: ["videoId"],
          properties: {
            videoId: { type: "string", pattern: "^[a-zA-Z0-9_-]{11}$" },
          },
        },
      },
    },
    async (request, reply) => {
      const { videoId } = request.params;

      // Return cached URL if still fresh
      const cached = streamCache.get(videoId);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return reply.send(cached.data);
      }

      try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;

        // -f: prefer m4a (iOS native), fall back to any audio-only, then best
        // -j: dump JSON (includes direct stream URL + metadata in one call)
        // --no-playlist: never accidentally pull a whole playlist
        const raw = await runYtDlp([
          "-f", "bestaudio[ext=m4a]/bestaudio/best",
          "--no-playlist",
          "--js-runtimes", "nodejs",
          // Use iOS client — bypasses bot detection on datacenter IPs
          "--extractor-args", "youtube:player_client=ios,android_vr",
          "-j",
          url,
        ]);

        const info: YtDlpJson = JSON.parse(raw);

        if (!info.url) {
          return reply.status(404).send({ error: "No audio stream found" });
        }

        // yt-dlp URLs expire — extract the expire param or estimate 6h
        const expireMatch = info.url.match(/expire=(\d+)/);
        const expiresAt = expireMatch
          ? new Date(parseInt(expireMatch[1], 10) * 1000).toISOString()
          : new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

        const result: StreamResult = {
          streamUrl: info.url,
          expiresAt,
          title: info.title,
          durationMs: Math.round(info.duration * 1000),
          thumbnail: info.thumbnail,
        };

        streamCache.set(videoId, { data: result, fetchedAt: Date.now() });

        return reply.send(result);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Failed to get stream URL" });
      }
    }
  );
}
