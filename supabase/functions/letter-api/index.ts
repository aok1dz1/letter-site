import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const MEDIA_BUCKET = "letter-media";
const JSON_LIMIT = 4_500_000;
const MAX_PHOTO_COUNT = 15;
const MAX_BACKGROUND_CHARS = 300_000;
const MAX_PHOTO_CHARS = 220_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function readServiceKey(): string {
  // Prefer the legacy JWT service_role key when available. supabase-js may
  // send its key as both apikey and Authorization; the new sb_secret_ key
  // is not a JWT, so use it only as a fallback if the legacy key is absent.
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keysRaw) {
    try {
      const keys = JSON.parse(keysRaw);
      if (typeof keys.default === "string") return keys.default;
    } catch (_) { /* fall through to explicit error */ }
  }
  throw new Error("Missing Supabase server key");
}

const admin = createClient(SUPABASE_URL, readServiceKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

function verifyPublicKey(req: Request): boolean {
  const supplied = req.headers.get("apikey") || "";
  const candidates: string[] = [];
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) candidates.push(legacy);
  const keysRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keysRaw) {
    try {
      const keys = JSON.parse(keysRaw);
      for (const value of Object.values(keys)) {
        if (typeof value === "string") candidates.push(value);
      }
    } catch (_) { /* malformed environment is ignored */ }
  }
  return supplied.length > 0 && candidates.length > 0 && candidates.includes(supplied);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, num));
}

function cleanText(value: unknown, max: number, fallback = ""): string {
  return (typeof value === "string" ? value : fallback).trim().slice(0, max);
}

function isPublicMediaUrl(value: unknown): value is string {
  return typeof value === "string" &&
    value.startsWith(SUPABASE_URL + "/storage/v1/object/public/" + MEDIA_BUCKET + "/") &&
    value.length < 600;
}

function dataUrlToBytes(value: unknown, maxChars: number): { bytes: Uint8Array; mime: string; ext: string } | null {
  if (typeof value !== "string" || value.length > maxChars) return null;
  const match = value.match(/^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const mime = match[1];
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  let binary: string;
  try { binary = atob(match[2]); } catch (_) { return null; }
  if (binary.length > 1_500_000) return null;
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime, ext };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function requestRateLimit(req: Request): Promise<boolean> {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const address = req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    forwarded.split(",")[0].trim() ||
    "unknown";
  const key = (await sha256Hex("letter-site-rate-v1:" + address)).slice(0, 48);
  const { data, error } = await admin.rpc("consume_letter_rate_limit", {
    p_ip_hash: key,
    p_max_attempts: 12,
  });
  if (error) throw new Error("Rate limiter unavailable");
  return data === true;
}

function randomId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadImage(id: string, key: string, raw: unknown, maxChars: number, uploadedPaths: string[]) {
  if (isPublicMediaUrl(raw)) return raw;
  const parsed = dataUrlToBytes(raw, maxChars);
  if (!parsed) throw new Error("Invalid image: " + key);
  const path = id + "/" + key + "." + parsed.ext;
  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, parsed.bytes, {
    contentType: parsed.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Image upload failed: " + error.message);
  uploadedPaths.push(path);
  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const allowedThemes = new Set(["rose", "blush", "berry", "lavender", "sage", "peach", "sky", "champagne", "midnight"]);
const allowedCrops = new Set(["portrait", "circle", "oval", "arch", "heart", "soft", "stamp", "landscape"]);
const allowedFrames = new Set(["polaroid", "white", "pink", "gold", "film", "none"]);
const allowedSizes = new Set(["small", "medium", "large"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (!verifyPublicKey(req)) return json(401, { error: "Missing or invalid project API key." });

  const url = new URL(req.url);
  if (req.method === "GET") {
    const id = url.searchParams.get("id") || "";
    if (!/^[a-f0-9]{16}$/.test(id)) return json(400, { error: "Invalid letter id." });
    const { data, error } = await admin.from("letters").select("data").eq("id", id).maybeSingle();
    if (error) {
      console.error("Letter read failed", error.message);
      return json(500, { error: "Unable to load this letter." });
    }
    if (!data) return json(404, { error: "Letter not found." });
    return json(200, { data: data.data });
  }

  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  let body: any;
  try {
    const length = Number(req.headers.get("content-length") || "0");
    if (length > JSON_LIMIT) return json(413, { error: "Letter payload is too large. Reduce image size or count." });
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > JSON_LIMIT) {
      return json(413, { error: "Letter payload is too large. Reduce image size or count." });
    }
    body = JSON.parse(raw);
  } catch (_) {
    return json(400, { error: "Invalid JSON payload." });
  }

  const source = body?.data;
  if (!source || typeof source !== "object" || Array.isArray(source)) return json(400, { error: "Missing letter data." });
  const kind = source.kind === "bouquet" ? "bouquet" : "letter";
  const recipient = cleanText(source.recipient, 80);
  const headerText = cleanText(source.headerText, 80, kind === "bouquet" ? "БУКЕТ ДЛЯ ТЕБЯ" : "ПИСЬМО ДЛЯ ТЕБЯ") || "ПИСЬМО ДЛЯ ТЕБЯ";
  const title = cleanText(source.title, 100, kind === "bouquet" ? "Небольшой букет для тебя" : "Несколько важных слов") || "Несколько важных слов";
  const message = typeof source.message === "string" ? source.message.trim().slice(0, 5000) : "";
  const signature = cleanText(source.signature, 100);
  const theme = allowedThemes.has(source.theme) ? source.theme : "rose";
  const backgroundMode = source.backgroundMode === "image" ? "image" : "color";

  if (!message) return json(400, { error: "Message text is required." });

  let attachedBouquet: any = null;
  if (kind !== "bouquet" && source.bouquet !== undefined && source.bouquet !== null) {
    const bouquet = source.bouquet;
    const allowedFlowerTypes = new Set(["rose", "peony", "ranunculus", "tulip", "daisy", "lily", "hydrangea", "gypsophila", "lavender", "carnation", "anemone", "sunflower"]);
    const allowedGreenery = new Set(["eucalyptus", "fern", "olive", "willow"]);
    if (!bouquet || typeof bouquet !== "object" || !Array.isArray(bouquet.flowers)) {
      return json(400, { error: "Invalid attached bouquet." });
    }
    if (bouquet.flowers.length < 1 || bouquet.flowers.length > 15) {
      return json(400, { error: "An attached bouquet can contain between 1 and 15 flowers." });
    }
    if (bouquet.flowers.some((flower: any) => !flower || !allowedFlowerTypes.has(flower.type))) {
      return json(400, { error: "One or more attached flower types are invalid." });
    }
    if (!allowedGreenery.has(bouquet.greenery)) return json(400, { error: "Invalid attached greenery style." });
    if (!allowedThemes.has(bouquet.theme)) return json(400, { error: "Invalid attached bouquet theme." });
    attachedBouquet = {
      flowers: bouquet.flowers.slice(0, 15).map((flower: any, index: number) => ({
        id: cleanText(flower.id, 80, "letter-bloom-" + (index + 1)) || ("letter-bloom-" + (index + 1)),
        type: flower.type,
        x: clampNumber(flower.x, 8, 92, 50),
        y: clampNumber(flower.y, 20, 86, 62),
        rotation: clampNumber(flower.rotation, -35, 35, 0),
        scale: clampNumber(flower.scale, 0.7, 1.3, 0.85),
      })),
      greenery: bouquet.greenery,
      theme: bouquet.theme,
      cardStyle: "cream",
    };
  }

  if (kind === "bouquet") {
    const bouquet = source.bouquet;
    const allowedFlowerTypes = new Set(["rose", "peony", "ranunculus", "tulip", "daisy", "lily", "hydrangea", "gypsophila", "lavender", "carnation", "anemone", "sunflower"]);
    const allowedGreenery = new Set(["eucalyptus", "fern", "olive", "willow"]);
    const allowedCardStyles = new Set(["cream", "vintage", "rose-gold", "midnight", "kraft", "garden"]);
    if (!bouquet || typeof bouquet !== "object" || !Array.isArray(bouquet.flowers)) {
      return json(400, { error: "Missing bouquet arrangement." });
    }
    if (bouquet.flowers.length < 3 || bouquet.flowers.length > 15) {
      return json(400, { error: "A bouquet must contain between 3 and 15 flowers." });
    }
    if (bouquet.flowers.some((flower: any) => !flower || !allowedFlowerTypes.has(flower.type))) {
      return json(400, { error: "One or more flower types are invalid." });
    }
    if (!allowedGreenery.has(bouquet.greenery)) return json(400, { error: "Invalid greenery style." });
    if (!allowedCardStyles.has(bouquet.cardStyle)) return json(400, { error: "Invalid card style." });
    if (!allowedThemes.has(bouquet.theme)) return json(400, { error: "Invalid bouquet theme." });
  } else {
    if (backgroundMode === "image" && !source.backgroundImage) {
      return json(400, { error: "Choose a background image or switch back to the gradient." });
    }
    if (!Array.isArray(source.floatingPhotos) || source.floatingPhotos.length > MAX_PHOTO_COUNT) {
      return json(400, { error: "Use no more than fifteen personal photos." });
    }
  }
  let allowed = false;
  try { allowed = await requestRateLimit(req); } catch (error) {
    console.error("Rate limit failed", String(error));
    return json(503, { error: "The service is temporarily unavailable. Try again shortly." });
  }
  if (!allowed) return json(429, { error: "Too many letters from this connection. Try again in about an hour." });

  const uploadedPaths: string[] = [];
  const id = randomId();
  try {
    if (kind === "bouquet") {
      const bouquet = source.bouquet;
      const defaultPositions = [
        { x: 34, y: 49 }, { x: 50, y: 40 }, { x: 66, y: 48 },
        { x: 25, y: 53 }, { x: 42, y: 55 }, { x: 58, y: 55 },
        { x: 75, y: 53 }, { x: 31, y: 39 }, { x: 69, y: 39 },
        { x: 39, y: 45 }, { x: 61, y: 44 }, { x: 26, y: 45 },
        { x: 74, y: 45 }, { x: 45, y: 51 }, { x: 55, y: 50 },
      ];
      const flowers = bouquet.flowers.slice(0, 15).map((flower: any, index: number) => {
        const pos = defaultPositions[index];
        return {
          id: cleanText(flower.id, 80, "bloom-" + (index + 1)),
          type: flower.type,
          x: clampNumber(flower.x, 8, 92, pos.x),
          y: clampNumber(flower.y, 22, 74, pos.y),
          rotation: clampNumber(flower.rotation, -35, 35, 0),
          scale: clampNumber(flower.scale, 0.7, 1.3, 1),
        };
      });
      const storedData = {
        kind: "bouquet",
        recipient,
        headerText: cleanText(source.headerText, 80, "БУКЕТ ДЛЯ ТЕБЯ"),
        title: cleanText(source.title, 100, "Небольшой букет для тебя"),
        message,
        signature,
        theme: bouquet.theme,
        bouquet: {
          flowers,
          greenery: bouquet.greenery,
          cardStyle: bouquet.cardStyle,
          theme: bouquet.theme,
        },
        floatingPhotos: [],
      };
      const { error } = await admin.from("letters").insert({ id, data: storedData });
      if (error) throw new Error("Database insert failed: " + error.message);
      return json(201, { id, url: "https://letter-site-sand.vercel.app/?l=" + id });
    }

    let backgroundImage = "";
    if (backgroundMode === "image") {
      backgroundImage = await uploadImage(id, "background", source.backgroundImage, MAX_BACKGROUND_CHARS, uploadedPaths);
    }

    const defaultPositions = [
      { x: 8, y: 46 }, { x: 92, y: 46 }, { x: 8, y: 55 },
      { x: 92, y: 55 }, { x: 8, y: 64 }, { x: 92, y: 64 },
      { x: 8, y: 73 }, { x: 92, y: 73 }, { x: 8, y: 82 },
      { x: 92, y: 82 }, { x: 18, y: 89 }, { x: 34, y: 90 },
      { x: 50, y: 90 }, { x: 66, y: 90 }, { x: 82, y: 89 },
    ];
    const floatingPhotos = [];
    for (let i = 0; i < source.floatingPhotos.length; i++) {
      const item = source.floatingPhotos[i];
      const imageSrc = typeof item === "string" ? item : item?.src;
      const src = await uploadImage(id, "photo-" + (i + 1), imageSrc, MAX_PHOTO_CHARS, uploadedPaths);
      const pos = defaultPositions[i];
      floatingPhotos.push({
        src,
        x: clampNumber(typeof item === "object" ? item.x : undefined, 5, 95, pos.x),
        y: clampNumber(typeof item === "object" ? item.y : undefined, 10, 90, pos.y),
        crop: allowedCrops.has(item?.crop) ? item.crop : "portrait",
        frame: allowedFrames.has(item?.frame) ? item.frame : "polaroid",
        size: allowedSizes.has(item?.size) ? item.size : "medium",
        rotation: clampNumber(typeof item === "object" ? item.rotation : undefined, -18, 18, (i % 2 ? 5 : -5)),
      });
    }

    const storedData = {
      recipient,
      headerText,
      title,
      message,
      signature,
      theme,
      backgroundMode: backgroundMode === "image" ? "image" : "color",
      backgroundImage,
      floatingPhotos,
      bouquet: attachedBouquet,
    };

    const { error } = await admin.from("letters").insert({ id, data: storedData });
    if (error) throw new Error("Database insert failed: " + error.message);
    return json(201, { id, url: "https://letter-site-sand.vercel.app/?l=" + id });
  } catch (error) {
    if (uploadedPaths.length) {
      try { await admin.storage.from(MEDIA_BUCKET).remove(uploadedPaths); } catch (_) { /* best effort cleanup */ }
    }
    console.error("Letter creation failed", String(error));
    return json(500, { error: "Could not save this letter. Check the images and try again." });
  }
});