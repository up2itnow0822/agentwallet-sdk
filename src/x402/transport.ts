import { lookup } from "node:dns/promises";
import { request, type RequestOptions } from "node:https";
import { isIP } from "node:net";
import { isPublicAddress } from "../identity/safe-fetch.js";
import type { FetchFunction } from "./types.js";

/** Default payment transport: a bounded HTTPS GET/HEAD with DNS pinned to a validated public address. */
export const fetchPublicPaymentResource: FetchFunction = async (
  input,
  init,
) => {
  const target = new URL(
    input instanceof Request ? input.url : input.toString(),
  );
  const method = (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase();
  if (
    target.protocol !== "https:" ||
    target.username ||
    target.password ||
    target.hash ||
    (target.port && target.port !== "443") ||
    !["GET", "HEAD"].includes(method) ||
    init?.body ||
    (input instanceof Request && input.body)
  )
    throw new Error(
      "Payment transport requires public HTTPS GET/HEAD without credentials or a body on port 443",
    );
  const controller = new AbortController();
  const callerSignal =
    init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const abort = (): void => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abort();
  else callerSignal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(
    () => controller.abort(new Error("Payment HTTPS deadline exceeded")),
    5000,
  );
  try {
    if (controller.signal.aborted) throw controller.signal.reason;
    const hostname = target.hostname.replace(/^\[|\]$/g, "");
    const records = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await Promise.race([
          lookup(hostname, { all: true, verbatim: true }),
          new Promise<never>((_, reject) =>
            controller.signal.addEventListener(
              "abort",
              () => reject(controller.signal.reason),
              { once: true },
            ),
          ),
        ]);
    if (controller.signal.aborted) throw controller.signal.reason;
    if (
      !records.length ||
      records.some((record) => !isPublicAddress(record.address))
    )
      throw new Error("Payment service DNS address is not public");
    const pinned = records[0]!;
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    for (const forbidden of [
      "host",
      "connection",
      "transfer-encoding",
      "content-length",
      "proxy-authorization",
      "proxy-connection",
    ])
      if (headers.has(forbidden))
        throw new Error(`Unsupported payment request header: ${forbidden}`);
    headers.set("accept-encoding", "identity");
    const response = await new Promise<Response>((resolve, reject) => {
      const options: RequestOptions & { autoSelectFamily: false } = {
        agent: false,
        family: pinned.family,
        autoSelectFamily: false,
        signal: controller.signal,
        method,
        headers: Object.fromEntries(headers),
        maxHeaderSize: 32768,
        lookup: (_host, _options, callback) =>
          callback(null, pinned.address, pinned.family),
      };
      const req = request(target, options, (res) => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status > 599 || (status >= 300 && status < 400)) {
          res.destroy();
          reject(
            new Error("Payment transport refuses invalid status or redirects"),
          );
          return;
        }
        if (
          res.headers["content-encoding"] &&
          res.headers["content-encoding"] !== "identity"
        ) {
          res.destroy();
          reject(new Error("Compressed payment response is unsupported"));
          return;
        }
        const declared = res.headers["content-length"];
        if (
          declared !== undefined &&
          (!/^\d+$/.test(declared) || Number(declared) > 1_048_576)
        ) {
          res.destroy();
          reject(new Error("Payment response exceeds byte limit"));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 1_048_576)
            req.destroy(new Error("Payment response exceeds byte limit"));
          else chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("aborted", () => reject(new Error("Payment response aborted")));
        res.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (Array.isArray(value))
              value.forEach((part) => responseHeaders.append(key, part));
            else if (value !== undefined) responseHeaders.set(key, value);
          }
          try {
            const body =
              method === "HEAD" || [204, 205, 304].includes(status)
                ? null
                : Buffer.concat(chunks);
            const result = new Response(body, {
              status,
              headers: responseHeaders,
            });
            Object.defineProperty(result, "url", { value: target.href });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
      req.on("error", reject);
      req.end();
    });
    return response;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", abort);
  }
};
