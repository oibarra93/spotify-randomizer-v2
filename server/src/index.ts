import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const {
  PORT = "8787",
  NODE_ENV = "development",
  ALLOWED_ORIGIN = "https://www.oscaribarra.com",
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI
} = process.env;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const clientId = requireEnv("SPOTIFY_CLIENT_ID", SPOTIFY_CLIENT_ID);
const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET", SPOTIFY_CLIENT_SECRET);
const redirectUriExpected = requireEnv("SPOTIFY_REDIRECT_URI", SPOTIFY_REDIRECT_URI);

type TokenExchangeBody = {
  code: string;
  code_verifier: string;
  redirect_uri: string;
};

type RefreshBody = {
  refresh_token: string;
};

function asFormUrlEncoded(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

function basicAuthHeader(id: string, secret: string) {
  const token = Buffer.from(`${id}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

async function main() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow curl/server-to-server (no Origin header)
      if (!origin) return cb(null, true);

      if (origin === ALLOWED_ORIGIN) return cb(null, true);

      cb(new Error("CORS: Origin not allowed"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 86400
  });

  fastify.get("/health", async () => {
    return { ok: true, service: "spotify-randomizer-api", env: NODE_ENV };
  });

  async function callSpotifyTokenEndpoint(form: Record<string, string>) {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": basicAuthHeader(clientId, clientSecret)
      },
      body: asFormUrlEncoded(form)
    });

    const text = await res.text();

    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // keep null
    }

    if (!res.ok) {
      fastify.log.warn(
        { status: res.status, body: json ?? text?.slice(0, 200) },
        "Spotify token endpoint error"
      );

      return {
        ok: false as const,
        status: res.status,
        body: json ?? {
          error: "invalid_response",
          error_description: "Non-JSON response from Spotify"
        }
      };
    }

    return { ok: true as const, status: res.status, body: json };
  }

  fastify.post<{ Body: TokenExchangeBody }>("/token", async (req, reply) => {
    const { code, code_verifier, redirect_uri } = (req.body ?? {}) as TokenExchangeBody;

    if (!code || !code_verifier || !redirect_uri) {
      return reply
        .code(400)
        .send({ error: "invalid_request", error_description: "Missing code, code_verifier, or redirect_uri" });
    }

    if (redirect_uri !== redirectUriExpected) {
      return reply
        .code(400)
        .send({ error: "invalid_request", error_description: "redirect_uri mismatch" });
    }

    const result = await callSpotifyTokenEndpoint({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      client_id: clientId,
      code_verifier
    });

    if (!result.ok) return reply.code(result.status).send(result.body);

    const { access_token, refresh_token, expires_in, scope, token_type } = result.body;
    return reply.code(200).send({ access_token, refresh_token, expires_in, scope, token_type });
  });

  fastify.post<{ Body: RefreshBody }>("/refresh", async (req, reply) => {
    const { refresh_token } = (req.body ?? {}) as RefreshBody;

    if (!refresh_token) {
      return reply
        .code(400)
        .send({ error: "invalid_request", error_description: "Missing refresh_token" });
    }

    const result = await callSpotifyTokenEndpoint({
      grant_type: "refresh_token",
      refresh_token,
      client_id: clientId
    });

    if (!result.ok) return reply.code(result.status).send(result.body);

    const { access_token, expires_in, scope, token_type } = result.body;
    const newRefreshToken = result.body.refresh_token;

    return reply.code(200).send({
      access_token,
      expires_in,
      scope,
      token_type,
      ...(newRefreshToken ? { refresh_token: newRefreshToken } : {})
    });
  });

  fastify.setErrorHandler((err: unknown, req, reply) => {
    const e = err instanceof Error ? err : new Error(String(err));

    fastify.log.error(e);

    if (String(e.message || "").includes("CORS")) {
      return reply.code(403).send({ error: "forbidden", error_description: "Origin not allowed" });
    }

    return reply.code(500).send({ error: "server_error" });
  });

  const port = Number(PORT);

  await fastify.listen({ port, host: "127.0.0.1" });
  fastify.log.info(`spotify-randomizer-api listening on 127.0.0.1:${port}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
