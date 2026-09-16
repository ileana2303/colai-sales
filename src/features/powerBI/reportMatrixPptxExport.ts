import { getPptxExportFileName } from "@/features/powerBI/PowerBiTable/utils";
import type { ReportMatrixPptxExportOptions } from "@/features/powerBI/types/reportMatrixPptxExport.types";

const SLIDE_WIDTH = 13.33;
const SLIDE_HEIGHT = 7.5;
const MARGIN_X = 0.4;
const CONTENT_WIDTH = SLIDE_WIDTH - MARGIN_X * 2;
const CONTENTS_SLIDE_NUMBER = 2;
const FIRST_TABLE_SLIDE_NUMBER = 3;
const BACK_TO_CONTENTS_LINK_WIDTH = 1.5;

function fitImageOnSlide(imageWidth: number, imageHeight: number, top: number) {
  const maxWidth = CONTENT_WIDTH;
  const maxHeight = SLIDE_HEIGHT - top - 0.35;
  const ratio = imageWidth / imageHeight;

  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  const x = MARGIN_X + (CONTENT_WIDTH - width) / 2;

  return { height, width, x, y: top };
}

type SummarySlideBlock = {
  bold?: boolean;
  color: string;
  fontSize: number;
  lineCount: number;
  lineSpacingMultiple?: number;
  spacingAfter: number;
  text: string;
};

function estimateBlockHeight(block: SummarySlideBlock) {
  const lineHeight = (block.fontSize / 58) * (block.lineSpacingMultiple ?? 1);
  return Math.max(0.4, block.lineCount * lineHeight) + block.spacingAfter;
}

type ContentsListItem = {
  slideNumber: number;
  text: string;
  title: string;
};

function buildContentsListItems(titles: string[]): ContentsListItem[] {
  return titles.map((title, index) => {
    const slideNumber = FIRST_TABLE_SLIDE_NUMBER + index;

    return {
      slideNumber,
      text: `${slideNumber}. ${title}`,
      title,
    };
  });
}

function buildLinkedContentsTextRuns(
  items: ContentsListItem[],
  fontSize: number,
  lineSpacingMultiple: number,
) {
  return items.map((item, index) => ({
    text: item.text,
    options: {
      breakLine: index < items.length - 1,
      color: "1D4ED8",
      fontFace: "Calibri",
      fontSize,
      hyperlink: {
        slide: item.slideNumber,
        tooltip: `Μετάβαση στη διαφάνεια ${item.slideNumber}: ${item.title}`,
      },
      lineSpacingMultiple,
      underline: { style: "sng" },
    },
  }));
}

function estimateContentsListHeight(
  lineCount: number,
  fontSize: number,
  lineSpacingMultiple: number,
) {
  return lineCount * (fontSize / 58) * lineSpacingMultiple;
}

function resolveContentsLayout(itemCount: number, listHeight: number) {
  const lineSpacingMultiple = 1.2;
  let fontSize = 14;

  while (fontSize >= 10) {
    for (let columns = 1; columns <= 2; columns += 1) {
      const rowsPerColumn = Math.ceil(itemCount / columns);
      const estimatedHeight = estimateContentsListHeight(
        rowsPerColumn,
        fontSize,
        lineSpacingMultiple,
      );

      if (estimatedHeight <= listHeight) {
        return {
          columns,
          fontSize,
          lineSpacingMultiple,
        };
      }
    }

    fontSize -= 1;
  }

  return {
    columns: 2,
    fontSize: 10,
    lineSpacingMultiple: 1.1,
  };
}

function splitItemsIntoColumns<T>(items: T[], columnCount: number) {
  const columns: T[][] = [];
  const rowsPerColumn = Math.ceil(items.length / columnCount);

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const start = columnIndex * rowsPerColumn;
    columns.push(items.slice(start, start + rowsPerColumn));
  }

  return columns;
}

type PptxTextSlide = {
  addText: (
    text: string | { text: string; options?: Record<string, unknown> }[],
    options?: Record<string, unknown>,
  ) => void;
};

function addSummarySlide(
  pptx: { addSlide: () => PptxTextSlide },
  options: ReportMatrixPptxExportOptions,
) {
  const slide = pptx.addSlide();
  const introBlocks: SummarySlideBlock[] = [
    {
      bold: true,
      color: "0F172A",
      fontSize: 36,
      lineCount: 1,
      spacingAfter: 0.28,
      text: options.brandLabel,
    },
  ];

  if (options.description) {
    introBlocks.push({
      color: "475569",
      fontSize: 16,
      lineCount: Math.max(1, options.description.split("\n").length),
      spacingAfter: 0.35,
      text: options.description,
    });
  }

  if (options.areaLabel && options.areaLabel !== "—") {
    introBlocks.push({
      bold: true,
      color: "1E3A5F",
      fontSize: 15,
      lineCount: 1,
      spacingAfter: options.periodSummary?.length ? 0.3 : 0,
      text: `ΠΕΡΙΟΧΗ: ${options.areaLabel}`,
    });
  }

  if (options.periodSummary?.length) {
    const summaryText = options.periodSummary
      .map((item) =>
        [item.label, item.value, item.hint ? `(${item.hint})` : ""]
          .filter(Boolean)
          .join(" · "),
      )
      .join("\n");

    introBlocks.push({
      color: "1D4ED8",
      fontSize: 14,
      lineCount: options.periodSummary.length,
      lineSpacingMultiple: 1.1,
      spacingAfter: 0,
      text: summaryText,
    });
  }

  const totalHeight = introBlocks.reduce(
    (sum, block) => sum + estimateBlockHeight(block),
    0,
  );
  let y = Math.max(0.55, (SLIDE_HEIGHT - totalHeight) / 2);

  for (const block of introBlocks) {
    const height = estimateBlockHeight(block) - block.spacingAfter;

    slide.addText(block.text, {
      align: "center",
      bold: block.bold ?? false,
      color: block.color,
      fontFace: "Calibri",
      fontSize: block.fontSize,
      h: height,
      lineSpacingMultiple: block.lineSpacingMultiple ?? 1,
      valign: "middle",
      w: CONTENT_WIDTH,
      x: MARGIN_X,
      y,
    });

    y += estimateBlockHeight(block);
  }
}

function addContentsSlide(
  pptx: { addSlide: () => PptxTextSlide },
  slideTitles: string[],
) {
  if (!slideTitles.length) return;

  const slide = pptx.addSlide();
  const titleY = 0.55;
  const titleHeight = 0.7;
  const listTop = titleY + titleHeight + 0.35;
  const listHeight = SLIDE_HEIGHT - listTop - 0.45;
  const contents = buildContentsListItems(slideTitles);
  const { columns, fontSize, lineSpacingMultiple } = resolveContentsLayout(
    contents.length,
    listHeight,
  );
  const columnGap = 0.45;
  const columnWidth =
    columns === 2
      ? (CONTENT_WIDTH - columnGap) / 2
      : Math.min(CONTENT_WIDTH, 8.5);

  slide.addText("Περιεχόμενα", {
    align: "left",
    bold: true,
    color: "0F172A",
    fontFace: "Calibri",
    fontSize: 30,
    h: titleHeight,
    valign: "middle",
    w: CONTENT_WIDTH,
    x: MARGIN_X,
    y: titleY,
  });

  const columnItems = splitItemsIntoColumns(contents, columns);
  const listX =
    columns === 2
      ? MARGIN_X
      : MARGIN_X + (CONTENT_WIDTH - columnWidth) / 2;

  columnItems.forEach((items, columnIndex) => {
    slide.addText(
      buildLinkedContentsTextRuns(items, fontSize, lineSpacingMultiple),
      {
        align: "left",
        h: listHeight,
        valign: "top",
        w: columnWidth,
        x:
          columns === 2
            ? listX + columnIndex * (columnWidth + columnGap)
            : listX,
        y: listTop,
      },
    );
  });
}

function addTableSlide(
  pptx: {
    addSlide: () => {
      addImage: (options: Record<string, unknown>) => void;
      addText: (
        text: string | { text: string; options?: Record<string, unknown> }[],
        options?: Record<string, unknown>,
      ) => void;
    };
  },
  options: ReportMatrixPptxExportOptions,
  slideData: ReportMatrixPptxExportOptions["slides"][number],
) {
  const slide = pptx.addSlide();
  const categoryLabel = options.categoryLabel ?? "Κατηγορία Στόχου";
  const titleWidth = CONTENT_WIDTH - BACK_TO_CONTENTS_LINK_WIDTH - 0.2;
  const backLinkX = MARGIN_X + CONTENT_WIDTH - BACK_TO_CONTENTS_LINK_WIDTH;

  slide.addText(slideData.title, {
    align: "left",
    bold: true,
    color: "0F172A",
    fontFace: "Calibri",
    fontSize: 18,
    h: 0.4,
    w: titleWidth,
    x: MARGIN_X,
    y: 0.25,
  });

  slide.addText(
    [
      {
        text: "Περιεχόμενα",
        options: {
          align: "right",
          bold: true,
          color: "1D4ED8",
          fontFace: "Calibri",
          fontSize: 11,
          hyperlink: {
            slide: CONTENTS_SLIDE_NUMBER,
            tooltip: "Επιστροφή στα Περιεχόμενα",
          },
          underline: { style: "sng" },
        },
      },
    ],
    {
      align: "right",
      h: 0.35,
      valign: "middle",
      w: BACK_TO_CONTENTS_LINK_WIDTH,
      x: backLinkX,
      y: 0.28,
    },
  );

  const metadata = [
    `ΠΕΡΙΟΧΗ: ${options.areaLabel}`,
    `${categoryLabel}: ${options.categoryFilterLabel}`,
    `ΟΜΑΔΑ: ${slideData.teamLabel}`,
    `Πωλητής: ${slideData.sellerLabel}`,
  ].join("   |   ");

  slide.addText(metadata, {
    color: "1E3A5F",
    fontFace: "Calibri",
    fontSize: 10,
    h: 0.35,
    w: CONTENT_WIDTH,
    x: MARGIN_X,
    y: 0.72,
  });

  const imagePlacement = fitImageOnSlide(
    slideData.imageWidth,
    slideData.imageHeight,
    1.15,
  );

  slide.addImage({
    data: slideData.imageDataUrl,
    h: imagePlacement.height,
    w: imagePlacement.width,
    x: imagePlacement.x,
    y: imagePlacement.y,
  });
}

export async function exportReportMatrixToPptx(
  options: ReportMatrixPptxExportOptions,
) {
  if (!options.slides.length) return;

  const pptxgen = (await import("pptxgenjs")).default;
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Colai Sales";
  pptx.title = options.brandLabel;

  addSummarySlide(pptx, options);
  addContentsSlide(
    pptx,
    options.slides.map((entry) => entry.title),
  );

  for (const slideData of options.slides) {
    addTableSlide(pptx, options, slideData);
  }

  await pptx.writeFile({
    fileName: getPptxExportFileName(options.brandLabel, options.exportFileName),
  });
}
