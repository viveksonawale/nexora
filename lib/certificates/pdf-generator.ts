import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { CertificateType } from "@prisma/client";
// Use the project's bundled QR engine (exact qrcodegen used by qrcode.react)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcodegen = require("./qrcodegen.js");

export interface CertificateSignatory {
  name: string;
  role: string;
  college?: string;
  signatureImageBase64?: string;
}

export interface CertificateRenderData {
  certificateId: string;
  verificationCode: string;
  verifyUrl: string;
  type: CertificateType;
  recipientName: string;
  hackathonTitle: string;
  collegeName: string;
  collegeLogoUrl?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  format?: string | null;
  location?: string | null;
  teamName?: string | null;
  position?: string | null;
  issuedAt: Date | string;
  signatories?: CertificateSignatory[] | null;
}

const FONTS = {
  interRegular: path.join(process.cwd(), "lib/assets/fonts/Inter-Regular.ttf"),
  interMedium: path.join(process.cwd(), "lib/assets/fonts/Inter-Medium.ttf"),
  interSemiBold: path.join(process.cwd(), "lib/assets/fonts/Inter-SemiBold.ttf"),
  interBold: path.join(process.cwd(), "lib/assets/fonts/Inter-Bold.ttf"),
  interItalic: path.join(process.cwd(), "lib/assets/fonts/Inter-Italic.ttf"),
  sourceSerifRegular: path.join(process.cwd(), "lib/assets/fonts/SourceSerif4-Regular.ttf"),
  sourceSerifSemiBold: path.join(process.cwd(), "lib/assets/fonts/SourceSerif4-Semibold.ttf"),
  sourceSerifBold: path.join(process.cwd(), "lib/assets/fonts/SourceSerif4-Bold.ttf"),
  sourceSerifItalic: path.join(process.cwd(), "lib/assets/fonts/SourceSerif4-Italic.ttf"),
};

const LOGO_PATH = path.join(process.cwd(), "public/logo/logo.png");

let cachedLogoBuffer: Buffer | null = null;
let cachedWatermarkBuffer: Buffer | null = null;

async function getLogoBuffers() {
  if (!cachedLogoBuffer && fs.existsSync(LOGO_PATH)) {
    const raw = fs.readFileSync(LOGO_PATH);
    cachedLogoBuffer = await sharp(raw).resize({ width: 300 }).png().toBuffer();
    cachedWatermarkBuffer = await sharp(raw).resize({ width: 600 }).png().toBuffer();
  }
  return {
    logo: cachedLogoBuffer,
    watermark: cachedWatermarkBuffer,
  };
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTitleForType(type: CertificateType): string {
  switch (type) {
    case CertificateType.WINNER:
      return "Certificate of Winner";
    case CertificateType.RUNNER_UP:
      return "Certificate of Runner-up";
    case CertificateType.ACHIEVEMENT:
      return "Certificate of Achievement";
    case CertificateType.PARTICIPATION:
    default:
      return "Certificate of Participation";
  }
}

function drawVectorQr(doc: PDFKit.PDFDocument, text: string, x: number, y: number, size: number) {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const cellSize = size / qr.size;

  doc.save();
  doc.fillColor("#000000");
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        // Crisp vector rectangle
        doc.rect(x + c * cellSize, y + r * cellSize, cellSize + 0.05, cellSize + 0.05).fill();
      }
    }
  }
  doc.restore();
}

export async function generateCertificatePdf(data: CertificateRenderData): Promise<Buffer> {
  const { watermark } = await getLogoBuffers();

  return new Promise<Buffer>((resolve, reject) => {
    // A4 dimensions in points: 595.28 x 841.89
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 56.7; // ~20mm
    const contentWidth = pageWidth - margin * 2; // ~481.88

    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margins: { top: margin, bottom: margin, left: margin, right: margin },
      autoFirstPage: false,
      info: {
        Title: `${getTitleForType(data.type)} - ${data.recipientName}`,
        Author: "Nexora",
        Subject: `Certificate of ${data.hackathonTitle}`,
        Keywords: "certificate, verification, nexora, hackathon",
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err: Error) => reject(err));

    doc.addPage();

    // Register embedded fonts
    doc.registerFont("Inter", FONTS.interRegular);
    doc.registerFont("Inter-Medium", FONTS.interMedium);
    doc.registerFont("Inter-SemiBold", FONTS.interSemiBold);
    doc.registerFont("Inter-Bold", FONTS.interBold);
    doc.registerFont("Inter-Italic", FONTS.interItalic);
    doc.registerFont("SourceSerif", FONTS.sourceSerifRegular);
    doc.registerFont("SourceSerif-SemiBold", FONTS.sourceSerifSemiBold);
    doc.registerFont("SourceSerif-Bold", FONTS.sourceSerifBold);
    doc.registerFont("SourceSerif-Italic", FONTS.sourceSerifItalic);

    // ========================================================
    // 1. TOP ORANGE ACCENT BAR (about 3mm = ~8.5pt)
    // ========================================================
    doc.rect(0, 0, pageWidth, 8.5).fill("#EA580C");

    // ========================================================
    // BACKGROUND WATERMARK (large logo image half outside)
    // ========================================================
    if (watermark) {
      doc.save();
      doc.opacity(0.04);
      // Position at bottom-right, half extending beyond the page margin and boundaries
      doc.image(watermark, 330, 470, { width: 440 });
      doc.restore();
    }

    let currentY = 48;

    // ========================================================
    // 2. COLLEGE LOGO & NAME
    // ========================================================
    if (data.collegeLogoUrl) {
      try {
        if (data.collegeLogoUrl.startsWith("data:image/")) {
          const base64Data = data.collegeLogoUrl.split(",")[1];
          const imgBuf = Buffer.from(base64Data, "base64");
          doc.image(imgBuf, (pageWidth - 90) / 2, currentY, { height: 32 });
          currentY += 40;
        } else if (fs.existsSync(data.collegeLogoUrl)) {
          doc.image(data.collegeLogoUrl, (pageWidth - 90) / 2, currentY, { height: 32 });
          currentY += 40;
        }
      } catch {
        // Missing / invalid college logo fallback cleanly without broken image
      }
    }

    // College Name centered in Inter semibold with letter-spacing
    doc
      .font("Inter-SemiBold")
      .fontSize(11)
      .fillColor("#1A1A1A")
      .text(data.collegeName.toUpperCase(), margin, currentY, {
        width: contentWidth,
        align: "center",
        characterSpacing: 1.8,
      });

    currentY += 20;

    // ========================================================
    // 3. VIA NEXORA MARK & WORDMARK
    // ========================================================
    const viaText = "via";
    const brandText = "NEXORA";
    doc.font("Inter").fontSize(8.5);
    const viaWidth = doc.widthOfString(viaText);
    doc.font("Inter-Bold").fontSize(9);
    const brandWidth = doc.widthOfString(brandText);
    const markSize = 10;
    const spacing = 5;
    const totalBrandWidth = viaWidth + spacing + markSize + spacing + brandWidth;
    const startX = (pageWidth - totalBrandWidth) / 2;

    doc
      .font("Inter")
      .fontSize(8.5)
      .fillColor("#5F6368")
      .text(viaText, startX, currentY);

    // Small Nexora mark in accent color #EA580C
    const markX = startX + viaWidth + spacing;
    const markY = currentY - 1;
    doc.roundedRect(markX, markY, markSize, markSize, 2.5).fill("#EA580C");

    // Nexora text in grey #5F6368
    doc
      .font("Inter-Bold")
      .fontSize(9)
      .fillColor("#5F6368")
      .text(brandText, markX + markSize + spacing, currentY, {
        characterSpacing: 1.2,
      });

    currentY += 22;

    // ========================================================
    // 4. SHORT ORANGE DIVIDER RULE
    // ========================================================
    const dividerWidth = 42;
    const dividerHeight = 1.75;
    doc
      .rect((pageWidth - dividerWidth) / 2, currentY, dividerWidth, dividerHeight)
      .fill("#EA580C");

    currentY += 24;

    // ========================================================
    // 5. TITLE ("Certificate of Participation" / variants)
    // ========================================================
    const titleText = getTitleForType(data.type);
    doc
      .font("SourceSerif-Bold")
      .fontSize(22)
      .fillColor("#1A1A1A")
      .text(titleText, margin, currentY, {
        width: contentWidth,
        align: "center",
        characterSpacing: 0.5,
      });

    currentY += 36;

    // ========================================================
    // 6. "This is to certify that" & STUDENT NAME
    // ========================================================
    doc
      .font("Inter")
      .fontSize(10)
      .fillColor("#5F6368")
      .text("This is to certify that", margin, currentY, {
        width: contentWidth,
        align: "center",
      });

    currentY += 20;

    // Dynamic sizing and wrapping for Recipient Name (up to 60 characters)
    let recipientFontSize = 26;
    doc.font("SourceSerif-SemiBold");
    let nameWidth = doc.fontSize(recipientFontSize).widthOfString(data.recipientName);

    // Shrink down if wide, down to minimum 17pt
    while (nameWidth > contentWidth && recipientFontSize > 17) {
      recipientFontSize -= 1;
      nameWidth = doc.fontSize(recipientFontSize).widthOfString(data.recipientName);
    }

    doc
      .font("SourceSerif-SemiBold")
      .fontSize(recipientFontSize)
      .fillColor("#1A1A1A")
      .text(data.recipientName, margin, currentY, {
        width: contentWidth,
        align: "center",
      });

    const nameTextHeight = doc.heightOfString(data.recipientName, {
      width: contentWidth,
    });
    currentY += nameTextHeight + 8;

    // Thin grey line beneath recipient name
    const underlineWidth = Math.min(Math.max(nameWidth + 40, 260), contentWidth);
    doc
      .rect((pageWidth - underlineWidth) / 2, currentY, underlineWidth, 0.75)
      .fill("#E5E7EB");

    currentY += 24;

    // ========================================================
    // 7. BODY TEXT
    // ========================================================
    const startStr = formatDate(data.startDate);
    const endStr = formatDate(data.endDate);
    const dateRange = startStr === endStr ? startStr : `${startStr} to ${endStr}`;

    const bodyParagraph = `has participated in ${data.hackathonTitle}, organized by ${data.collegeName}, held from ${dateRange}. Attendance verified through the Nexora platform.`;

    doc
      .font("Inter")
      .fontSize(10.5)
      .fillColor("#1A1A1A")
      .text(bodyParagraph, margin + 20, currentY, {
        width: contentWidth - 40,
        align: "center",
        lineGap: 4.5,
      });

    currentY += 56;

    // ========================================================
    // 8. DETAILS ROW (Light-bordered fields)
    // ========================================================
    interface DetailField {
      label: string;
      value: string;
    }

    const details: DetailField[] = [];

    // Format
    if (data.format) {
      const formatLabel = data.format.replace(/_/g, " ").toLowerCase();
      const capitalized = formatLabel.charAt(0).toUpperCase() + formatLabel.slice(1);
      details.push({ label: "FORMAT", value: capitalized });
    } else {
      details.push({ label: "FORMAT", value: "Hybrid" });
    }

    // Location (omit cleanly if missing)
    if (data.location && data.location.trim().length > 0) {
      details.push({ label: "LOCATION", value: data.location.trim() });
    }

    // Team
    if (data.teamName && data.teamName.trim().length > 0) {
      details.push({ label: "TEAM", value: data.teamName.trim() });
    }

    // Position for winners
    if (
      (data.type === CertificateType.WINNER ||
        data.type === CertificateType.RUNNER_UP ||
        data.type === CertificateType.ACHIEVEMENT) &&
      data.position
    ) {
      details.push({ label: "POSITION", value: data.position });
    }

    if (details.length > 0) {
      const numCols = details.length;
      const colGap = 10;
      const totalColWidth = contentWidth - (numCols - 1) * colGap;
      const colWidth = totalColWidth / numCols;
      const boxHeight = 44;

      details.forEach((item, idx) => {
        const boxX = margin + idx * (colWidth + colGap);
        // Box outline
        doc
          .roundedRect(boxX, currentY, colWidth, boxHeight, 4)
          .lineWidth(0.75)
          .strokeColor("#E5E7EB")
          .stroke();

        // Label
        doc
          .font("Inter-Medium")
          .fontSize(7.5)
          .fillColor("#5F6368")
          .text(item.label, boxX + 6, currentY + 7, {
            width: colWidth - 12,
            align: "center",
            characterSpacing: 0.8,
          });

        // Value
        doc
          .font("Inter-SemiBold")
          .fontSize(9.5)
          .fillColor("#1A1A1A")
          .text(item.value, boxX + 4, currentY + 22, {
            width: colWidth - 8,
            align: "center",
            ellipsis: true,
          });
      });

      currentY += boxHeight + 42;
    } else {
      currentY += 30;
    }

    // ========================================================
    // 9. SIGNATORIES (One or two columns)
    // ========================================================
    const signatories =
      data.signatories && data.signatories.length > 0
        ? data.signatories.slice(0, 2)
        : [
            {
              name: "Authorized Official",
              role: "Convener & Head of Hackathons",
              college: data.collegeName,
            },
          ];

    const sigCount = signatories.length;
    const sigColWidth = 190;
    const sigTotalWidth = sigCount === 1 ? sigColWidth : sigColWidth * 2 + 60;
    const sigStartX = (pageWidth - sigTotalWidth) / 2;

    signatories.forEach((sig, idx) => {
      const colX = sigStartX + idx * (sigColWidth + 60);
      let sigY = currentY;

      // Optional signature image
      if (sig.signatureImageBase64) {
        try {
          if (sig.signatureImageBase64.startsWith("data:image/")) {
            const base64Data = sig.signatureImageBase64.split(",")[1];
            const sigBuf = Buffer.from(base64Data, "base64");
            doc.image(sigBuf, colX + (sigColWidth - 90) / 2, sigY, { height: 28 });
          } else if (fs.existsSync(sig.signatureImageBase64)) {
            doc.image(sig.signatureImageBase64, colX + (sigColWidth - 90) / 2, sigY, { height: 28 });
          }
        } catch {
          // ignore broken signature image
        }
      }

      sigY += 32;

      // Signature line
      doc.rect(colX + 15, sigY, sigColWidth - 30, 0.75).fill("#D1D5DB");
      sigY += 8;

      // Name
      doc
        .font("Inter-SemiBold")
        .fontSize(9.5)
        .fillColor("#1A1A1A")
        .text(sig.name, colX, sigY, { width: sigColWidth, align: "center" });

      sigY += 13;

      // Role
      doc
        .font("Inter")
        .fontSize(8)
        .fillColor("#5F6368")
        .text(sig.role, colX, sigY, { width: sigColWidth, align: "center" });

      if (sig.college) {
        sigY += 11;
        doc
          .font("Inter")
          .fontSize(7.5)
          .fillColor("#5F6368")
          .text(sig.college, colX, sigY, { width: sigColWidth, align: "center" });
      }
    });

    // ========================================================
    // 10. FOOTER (QR code on left; ID, issue date, verifyUrl on right)
    // ========================================================
    const footerY = pageHeight - margin - 58;
    const qrSize = 54;

    // Divider line above footer
    doc
      .rect(margin, footerY - 14, contentWidth, 0.5)
      .fill("#E5E7EB");

    // QR Code on Left (Vector drawing)
    drawVectorQr(doc, data.verifyUrl, margin, footerY, qrSize);

    // Certificate metadata on Right
    const metaX = margin + qrSize + 16;
    const metaWidth = contentWidth - qrSize - 16;

    doc
      .font("Inter-SemiBold")
      .fontSize(8.5)
      .fillColor("#1A1A1A")
      .text(`Certificate ID: ${data.certificateId}`, metaX, footerY + 4, {
        width: metaWidth,
      });

    const issuedDateStr = formatDate(data.issuedAt);
    doc
      .font("Inter")
      .fontSize(8)
      .fillColor("#5F6368")
      .text(`Issued: ${issuedDateStr}`, metaX, footerY + 18, {
        width: metaWidth,
      });

    doc
      .font("Inter")
      .fontSize(8)
      .fillColor("#5F6368")
      .text(`Verify at ${data.verifyUrl}`, metaX, footerY + 32, {
        width: metaWidth,
      });

    doc.end();
  });
}
