# ABA PayWay Payment Integration

A teaching guide for understanding how payment processing works in this Express backend.

---

## What is ABA PayWay?

**ABA PayWay** is a payment gateway provided by ABA Bank (Cambodia). It allows merchants to accept payments via:

- **Credit/Debit Cards** — a popup form hosted by ABA
- **QR Code** — KHQR or ABA Pay (customer scans with their mobile app)

This project uses the **sandbox environment** for testing (no real money).

---

## Environment Variables

Add these to your `.env` file:

| Variable                 | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `ABA_PAYWAY_MERCHANT_ID` | Your Merchant ID from ABA                          |
| `ABA_PAYWAY_API_KEY`     | Secret key used for signing requests (HMAC-SHA512) |
| `ABA_PAYWAY_BASE_URL`    | `https://checkout-sandbox.payway.com.kh` (sandbox) |
| `FRONTEND_URL`           | Your frontend URL (e.g. `http://localhost:5173`)   |
| `BACKEND_URL`            | Your backend URL (e.g. `http://localhost:3000`)    |

---

## Database Model: `Payment`

File: `models/payment.js`

| Field          | Type    | Description                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| `orderId`      | INTEGER | Links to the Order                                           |
| `paywayTranId` | STRING  | Unique transaction ID sent to ABA (e.g. `ORD-1714000000000`) |
| `amount`       | DECIMAL | Payment amount in USD                                        |
| `method`       | STRING  | `ABA_PAYWAY` or `ABA_PAYWAY_QR`                              |
| `status`       | STRING  | `PENDING`, `PAID`, or `FAILED`                               |
| `paidAt`       | DATE    | Timestamp when payment was confirmed                         |
| `remark`       | TEXT    | Raw response from ABA (stored as JSON string)                |

**Status Lifecycle:**

```
PENDING  ──>  PAID
         ──>  FAILED
```

---

## API Endpoints

### 1. POST `/payment/:orderId` — Initiate Card Payment

Starts a card payment session for an order. Method is always `ABA_PAYWAY` (hardcoded).

**Flow:**

```
1. Fetch the Order from the database (with Customer and OrderDetails)
2. Check if a PENDING payment already exists → reuse it (prevent duplicates)
3. If no payment exists → create a new Payment record (method: "ABA_PAYWAY", status: PENDING)
4. Build the PayWay payload (merchant info, amount, customer info, URLs)
5. Sign the payload with HMAC-SHA512 → attach as `hash`
6. Return the payload to the frontend
7. Frontend submits it as a form to ABA → ABA shows the card popup
```

This is the "All-in-One" solution typically used for websites or mobile apps. When you trigger a purchase call, PayWay takes over the heavy lifting.
Best for: Standard e-commerce sites where you want to offer every possible payment method without building separate interfaces for each one.

**Request:**

```
POST /payment/42
```

**Response:**

```json
{
  "message": "Payment initiated",
  "data": {
    "payment": {
      "id": 1,
      "paywayTranId": "ORD-1714000000000",
      "status": "PENDING"
    },
    "payway": {
      "action": "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
      "method": "POST",
      "fields": {
        "merchant_id": "...",
        "tran_id": "ORD-1714000000000",
        "amount": "25.00",
        "hash": "..."
      }
    }
  }
}
```

---

### 2. POST `/payment/:tranId/check-transaction` — Verify Payment Status

Checks with ABA whether a transaction was paid, failed, or still pending.

**Flow:**

```
1. Find the Payment in the database by paywayTranId
2. Build a signed hash (req_time + merchant_id + tran_id)
3. Call ABA's check-transaction-2 API
4. Read the response:
   - status code "00" → ABA responded successfully
   - paymentStatus "APPROVED" → update DB to PAID
   - paymentStatus "DECLINED" / "FAILED" → update DB to FAILED
   - Otherwise → keep as PENDING
5. Save updated payment + raw ABA response (remark)
6. Return both local payment and ABA response to frontend
```

**Request:**

```
POST /payment/ORD-1714000000000/check-transaction
```

---

### 3. POST `/payment/:orderId/generate-qr` — Generate QR Code

Generates a KHQR/ABA Pay QR code for the customer to scan. Method is always `ABA_PAYWAY_QR` (hardcoded).

The QR API is a specialized tool used to generate a dynamic KHQR code that can be displayed on your own hardware or interface.

Best for: Physical "face-to-face" digital setups, such as Self-service Kiosks, POS screens (cashier facing the customer), or even printing a unique QR on a physical receipt.
**Flow:**

```
1. Fetch Order from DB
2. Check/create PENDING payment (method: "ABA_PAYWAY_QR", same duplicate prevention logic)
3. Build QR payload (similar to card, but with callback_url instead of return_url)
4. Sign with HMAC-SHA512 → attach as `hash`
5. Call ABA generate-qr API
6. ABA returns a QR image (base64 or URL)
7. Return QR data to frontend for display
```

**Key difference from card payment:**

- Uses `callback_url` → ABA calls your backend when the QR is scanned and paid
- Frontend displays the QR image; customer scans it with ABA mobile app

---

## Security: How Request Signing Works

Every request to ABA **must include a hash** to prove it came from you and was not tampered with.

**Algorithm: HMAC-SHA512**

```
Step 1: Concatenate specific fields in a fixed order
        raw = req_time + merchant_id + tran_id + amount + items + ...

Step 2: Sign with your secret key
        hash = HMAC-SHA512(raw, ABA_PAYWAY_API_KEY)

Step 3: Encode to Base64
        hash_base64 = Buffer(hash).toString('base64')

Step 4: Send hash_base64 in the request body
```

**Why this matters:** ABA will reject any request where the hash doesn't match. This prevents attackers from modifying the amount or other fields.

---

## Utility Functions

File: `src/utils/payway.js`

| Function                             | Purpose                                                    |
| ------------------------------------ | ---------------------------------------------------------- |
| `getReqTime()`                       | Returns current time as `YYYYMMDDHHmmss` (required by ABA) |
| `encodeBase64(str)`                  | Converts a string to Base64 (used for items list and URLs) |
| `signPayWay(raw)`                    | Core HMAC-SHA512 signing function                          |
| `buildPurchaseHash(payload)`         | Builds hash for card payment requests                      |
| `buildQrHash(payload)`               | Builds hash for QR generation requests                     |
| `buildCheckTransactionHash(payload)` | Builds hash for check-transaction requests                 |

---

## Testing with Sandbox

> Sandbox URL: `https://checkout-sandbox.payway.com.kh`
> No real money is charged in sandbox mode.
