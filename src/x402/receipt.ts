import { PAYMENT_RECEIPT_HEADER, type X402PaymentReceipt } from "./types.js";
import { copyX402PaymentRecovery } from "./recovery.js";

const locallyConfirmed = new WeakMap<Response, X402PaymentReceipt>();
const constructionAuthority = Symbol("confirmed payment response authority");
interface ResponseLocation {
  readonly url: string;
  readonly redirected: boolean;
  readonly type: Response["type"];
}

class ConfirmedPaymentResponse extends Response {
  override readonly url: string;
  override readonly redirected: boolean;
  override readonly type: Response["type"];
  readonly #receipt: X402PaymentReceipt;
  readonly #location: ResponseLocation;
  constructor(
    authority: typeof constructionAuthority,
    response: Response,
    receipt: X402PaymentReceipt,
    location?: ResponseLocation,
  ) {
    if (authority !== constructionAuthority)
      throw new Error("Confirmed payment response construction requires local client authority");
    const headers = new Headers(response.headers);
    headers.set(
      PAYMENT_RECEIPT_HEADER,
      Buffer.from(JSON.stringify(receipt), "utf8").toString("base64"),
    );
    super(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    this.#receipt = Object.freeze(receipt);
    this.#location = Object.freeze(location ?? {
      url: response.url,
      redirected: response.redirected,
      type: response.type,
    });
    this.url = this.#location.url;
    this.redirected = this.#location.redirected;
    this.type = this.#location.type;
    locallyConfirmed.set(this, this.#receipt);
  }
  override clone(): Response {
    const receipt = locallyConfirmed.get(this);
    if (!receipt)
      throw new TypeError("Payment response clone requires an original locally confirmed response");
    const response = new ConfirmedPaymentResponse(constructionAuthority, super.clone(), receipt, this.#location);
    copyX402PaymentRecovery(this, response);
    return response;
  }
}

/** Internal: attach facts only after the client verifies the receipt/transfer and records settlement. */
export function withX402PaymentReceipt(
  response: Response,
  receipt: X402PaymentReceipt,
): Response {
  return new ConfirmedPaymentResponse(constructionAuthority, response, Object.freeze({ ...receipt }));
}

/** Read immutable local settlement facts. Incoming or copied receipt headers are never payment evidence. */
export function getX402PaymentReceipt(
  response: Response,
): X402PaymentReceipt | undefined {
  return locallyConfirmed.get(response);
}
