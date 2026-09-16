import { toPng } from "html-to-image";

type ViewportCaptureStyles = {
  height: string;
  maxHeight: string;
  overflow: string;
  viewportHeight: string | null;
};

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function readViewportCaptureStyles(
  viewport: HTMLElement | null,
): ViewportCaptureStyles {
  return {
    height: viewport?.style.height ?? "",
    maxHeight: viewport?.style.maxHeight ?? "",
    overflow: viewport?.style.overflow ?? "",
    viewportHeight:
      viewport?.style.getPropertyValue("--report-matrix-viewport-height") ??
      null,
  };
}

function applyViewportCaptureStyles(viewport: HTMLElement | null) {
  if (!viewport) return;

  viewport.style.removeProperty("--report-matrix-viewport-height");
  viewport.style.height = "auto";
  viewport.style.maxHeight = "none";
  viewport.style.overflow = "visible";
}

function restoreViewportCaptureStyles(
  viewport: HTMLElement | null,
  styles: ViewportCaptureStyles,
) {
  if (!viewport) return;

  if (styles.viewportHeight) {
    viewport.style.setProperty(
      "--report-matrix-viewport-height",
      styles.viewportHeight,
    );
  } else {
    viewport.style.removeProperty("--report-matrix-viewport-height");
  }

  viewport.style.height = styles.height;
  viewport.style.maxHeight = styles.maxHeight;
  viewport.style.overflow = styles.overflow;
}

export async function captureReportMatrixTable(table: HTMLElement) {
  const viewport = table.closest<HTMLElement>(".report-matrix__viewport");
  const previousStyles = readViewportCaptureStyles(viewport);

  applyViewportCaptureStyles(viewport);
  await waitForPaint();

  const imageWidth = table.scrollWidth;
  const imageHeight = table.scrollHeight;

  const imageDataUrl = await toPng(table, {
    backgroundColor: "#ffffff",
    cacheBust: true,
    height: imageHeight,
    pixelRatio: 2,
    width: imageWidth,
  });

  restoreViewportCaptureStyles(viewport, previousStyles);

  return {
    imageDataUrl,
    imageHeight,
    imageWidth,
  };
}
