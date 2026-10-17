import { createHash } from "node:crypto";
import { authorizeAdminApi } from "@/lib/admin-api";

const PRODUCT_IMAGE_FOLDER = "hbca-products";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json({ error: "Cloudinary is not configured on this server." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid image information." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("contentType" in body) ||
    typeof body.contentType !== "string" ||
    !ACCEPTED_IMAGE_TYPES.has(body.contentType) ||
    !("size" in body) ||
    typeof body.size !== "number" ||
    body.size < 1 ||
    body.size > MAX_IMAGE_BYTES
  ) {
    return Response.json({ error: "Choose a JPG, PNG or WebP image up to 10 MB." }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${PRODUCT_IMAGE_FOLDER}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return Response.json({
    cloudName,
    apiKey,
    timestamp,
    folder: PRODUCT_IMAGE_FOLDER,
    signature,
  });
}
