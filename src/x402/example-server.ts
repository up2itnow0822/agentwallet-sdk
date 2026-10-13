import { createServer, type ServerOptions, type Server } from "node:https";
import {
  GuardedPaymentMerchant,
  type VerifiedGuardedPayment,
} from "./merchant.js";
import {
  PAYMENT_HEADER,
  PAYMENT_REQUIRED_HEADER,
  type FetchFunction,
} from "./types.js";
export type PaidResource = (
  payment: VerifiedGuardedPayment,
) => Response | Promise<Response>;
/** Framework-neutral reference merchant resource. Only an exact configured GET/HEAD endpoint is served. */
export function createGuardedPaymentResource(
  merchant: GuardedPaymentMerchant,
  serve: PaidResource,
): FetchFunction {
  return async (input, init) => {
    const resource = input instanceof Request ? input.url : input.toString(),
      method = (
        init?.method ?? (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
    if (resource !== merchant.resource || !["GET", "HEAD"].includes(method))
      return new Response("Unknown payment resource", { status: 404 });
    const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      ),
      proof = headers.get(PAYMENT_HEADER);
    if (!proof) {
      try {
        const challenge = await merchant.issueChallenge();
        return new Response(null, {
          status: 402,
          headers: {
            [PAYMENT_REQUIRED_HEADER]: Buffer.from(
              JSON.stringify(challenge),
            ).toString("base64"),
            "cache-control": "no-store",
          },
        });
      } catch {
        return new Response("Payment service unavailable", {
          status: 503,
          headers: { "cache-control": "no-store" },
        });
      }
    }
    let verified: VerifiedGuardedPayment;
    try {
      verified = await merchant.verifyPayment(proof);
    } catch {
      return new Response("Payment proof rejected", {
        status: 403,
        headers: { "cache-control": "no-store" },
      });
    }
    try {
      const response = await serve(verified);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("cache-control", "private, no-store");
      return new Response(method === "HEAD" ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch {
      return new Response(
        "Paid resource failed; contact the merchant with transaction hash",
        { status: 500, headers: { "cache-control": "no-store" } },
      );
    }
  };
}
/** Opt-in HTTPS reference server. TLS material stays in caller memory; this factory never listens/deploys or exposes admin endpoints. */
export function createGuardedPaymentHttpsServer(
  merchant: GuardedPaymentMerchant,
  serve: PaidResource,
  tls: ServerOptions,
): Server {
  const handler = createGuardedPaymentResource(merchant, serve),
    origin = new URL(merchant.resource).origin;
  return createServer(
    {
      ...tls,
      minVersion: "TLSv1.2",
      maxHeaderSize: 32768,
      requestTimeout: 5000,
      headersTimeout: 5000,
    },
    (request, response) => {
      const work = async (): Promise<void> => {
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.writeHead(405);
          response.end();
          return;
        }
        if (
          request.headers["transfer-encoding"] ||
          Number(request.headers["content-length"] ?? 0) !== 0
        ) {
          response.writeHead(400);
          response.end();
          return;
        }
        const result = await handler(new URL(request.url ?? "/", origin), {
          method: request.method,
          headers: Object.fromEntries(
            Object.entries(request.headers).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          ),
        });
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(Buffer.from(await result.arrayBuffer()));
      };
      void work().catch(() => {
        if (!response.headersSent) response.writeHead(503);
        response.end();
      });
    },
  );
}
