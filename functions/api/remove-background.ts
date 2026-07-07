type Env = {
  REMOVEBG_API_KEY?: string;
  MAX_UPLOAD_MB?: string;
};

type ErrorBody = {
  error: string;
};

const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
// Keep the fallback upload cap aligned with the public UI copy.
const DEFAULT_MAX_UPLOAD_MB = 10;

function jsonError(message: string, status: number) {
  return Response.json({ error: message } satisfies ErrorBody, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getMaxUploadBytes(env: Env) {
  const configured = Number(env.MAX_UPLOAD_MB);
  const maxMb =
    Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_MAX_UPLOAD_MB;

  return maxMb * 1024 * 1024;
}

async function readRemoveBgError(response: Response) {
  const contentType = response.headers.get("Content-Type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as {
        errors?: Array<{ title?: string }>;
        error?: string;
      };
      return (
        body.errors?.[0]?.title ||
        body.error ||
        "Background removal failed. Please try another image."
      );
    }

    const text = await response.text();
    return text || "Background removal failed. Please try another image.";
  } catch {
    return "Background removal failed. Please try another image.";
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.REMOVEBG_API_KEY) {
    return jsonError("Remove.bg API key is not configured.", 500);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid multipart form data.", 400);
  }

  const image = formData.get("image_file");

  if (!(image instanceof File)) {
    return jsonError("Please upload an image file.", 400);
  }

  if (!SUPPORTED_TYPES.has(image.type)) {
    return jsonError("Supported formats are JPG, PNG, and WebP.", 400);
  }

  if (image.size > getMaxUploadBytes(env)) {
    return jsonError("Image is too large. Please upload a file under 10 MB.", 413);
  }

  const removeBgForm = new FormData();
  removeBgForm.append("image_file", image, image.name || "upload.png");
  removeBgForm.append("size", String(formData.get("size") || "auto"));
  removeBgForm.append("format", String(formData.get("format") || "png"));

  let removeBgResponse: Response;

  try {
    removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": env.REMOVEBG_API_KEY,
      },
      body: removeBgForm,
    });
  } catch {
    return jsonError("Could not reach the background removal service.", 502);
  }

  if (!removeBgResponse.ok) {
    const message = await readRemoveBgError(removeBgResponse);
    const status = removeBgResponse.status === 429 ? 429 : 502;

    return jsonError(message, status);
  }

  return new Response(removeBgResponse.body, {
    status: 200,
    headers: {
      "Content-Type":
        removeBgResponse.headers.get("Content-Type") || "image/png",
      "Cache-Control": "no-store",
    },
  });
};

export const onRequest: PagesFunction<Env> = () =>
  jsonError("Method not allowed.", 405);
