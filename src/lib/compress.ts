/**
 * Client-side document compression, run in the admin's browser before upload.
 * Nothing uncompressed is stored. Everything degrades gracefully: any failure
 * returns null and the caller keeps the original file.
 *
 *  - image  -> downscaled JPEG wrapped in a 1-page PDF
 *  - pdf    -> scanned PDFs are re-rasterised at ~150 DPI JPEG (big win, the
 *              source was already images); born-digital PDFs get a structural
 *              re-save only so selectable text survives
 *  - md/docx -> left as-is (already small / zip-compressed)
 */

export interface CompressResult {
  bytes: Uint8Array;
  contentType: string;
  ext: string;
}

const IMG_MAX_EDGE_AGGR = 1800;
const IMG_MAX_EDGE_SOFT = 2600;
const IMG_Q_AGGR = 0.7;
const IMG_Q_SOFT = 0.85;

const PDF_DPI_AGGR = 150;
const PDF_JPEG_Q_AGGR = 0.68;
const PDF_MAX_RASTER_PAGES = 220; // guard client memory

function canvasToJpeg(canvas: HTMLCanvasElement, q: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? b.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)))
          : reject(new Error("toBlob failed")),
      "image/jpeg",
      q,
    );
  });
}

async function imageToCompressedPdf(
  file: File,
  aggressive: boolean,
): Promise<CompressResult | null> {
  try {
    const maxEdge = aggressive ? IMG_MAX_EDGE_AGGR : IMG_MAX_EDGE_SOFT;
    const quality = aggressive ? IMG_Q_AGGR : IMG_Q_SOFT;

    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();

    const jpeg = await canvasToJpeg(canvas, quality);
    canvas.width = 0;
    canvas.height = 0;

    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const img = await pdf.embedJpg(jpeg);
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    const bytes = await pdf.save();
    return { bytes, contentType: "application/pdf", ext: "pdf" };
  } catch {
    return null;
  }
}

async function compressPdf(
  file: File,
  aggressive: boolean,
): Promise<CompressResult | null> {
  const data = new Uint8Array(await file.arrayBuffer());
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;

    // Sample the first few pages: lots of text => born-digital, keep it vector.
    const sample = Math.min(doc.numPages, 5);
    let chars = 0;
    for (let i = 1; i <= sample; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      for (const it of tc.items) {
        if (typeof (it as { str?: unknown }).str === "string") {
          chars += (it as { str: string }).str.length;
        }
      }
    }
    const scanned = chars / sample < 45;

    const { PDFDocument } = await import("pdf-lib");

    if (!scanned || doc.numPages > PDF_MAX_RASTER_PAGES) {
      // Structural re-save only (safe, keeps text). Use it only if smaller.
      const src = await PDFDocument.load(data);
      const out = await src.save({ useObjectStreams: true });
      return out.byteLength < data.byteLength * 0.97
        ? { bytes: out, contentType: "application/pdf", ext: "pdf" }
        : null;
    }

    // Scanned -> rasterise each page to a compressed JPEG and rebuild.
    const dpi = aggressive ? PDF_DPI_AGGR : 190;
    const q = aggressive ? PDF_JPEG_Q_AGGR : 0.8;
    const scale = dpi / 72;
    const outPdf = await PDFDocument.create();

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(vp.width));
      canvas.height = Math.max(1, Math.floor(vp.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
      const jpeg = await canvasToJpeg(canvas, q);
      canvas.width = 0;
      canvas.height = 0;

      const img = await outPdf.embedJpg(jpeg);
      const p = outPdf.addPage([vp.width, vp.height]);
      p.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
    }

    const bytes = await outPdf.save();
    return bytes.byteLength < data.byteLength * 0.9
      ? { bytes, contentType: "application/pdf", ext: "pdf" }
      : null;
  } catch {
    return null;
  }
}

export async function compressForUpload(
  file: File,
  kind: "pdf" | "docx" | "md" | "image",
  aggressive: boolean,
): Promise<CompressResult | null> {
  if (kind === "image") return imageToCompressedPdf(file, aggressive);
  if (kind === "pdf") return compressPdf(file, aggressive);
  return null; // md / docx: nothing worthwhile client-side
}
