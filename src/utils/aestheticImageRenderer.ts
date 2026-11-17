import { Platform } from 'react-native';
import {
  AestheticReportModel,
  DualColumnItem,
  SummaryTableRow,
} from '../types/imageReport';

export interface RenderResult {
  dataUrl: string;
  blob?: Blob;
  width: number;
  height: number;
}

/**
 * Renders an Aesthetic Table Report to an HTML5 Canvas and returns a high-resolution PNG data URL and Blob.
 */
export async function renderAestheticReportToCanvas(
  model: AestheticReportModel
): Promise<RenderResult | null> {
  if (typeof document === 'undefined') {
    return null;
  }

  const { theme, layoutMode } = model;

  // High-DPI canvas dimensions
  const width = 1200;
  const paddingX = 40;
  const paddingY = 44;
  const cardX = paddingX;
  const cardY = paddingY;
  const cardW = width - paddingX * 2; // 1120

  // Calculate table row counts and dynamic height
  const innerMargin = 36;
  const tableX = cardX + innerMargin;
  const tableW = cardW - innerMargin * 2; // 1048

  let tableH = 0;
  let rowH = 50;
  let numRows = 0;

  if (layoutMode === 'dual_column') {
    numRows = Math.max(model.leftItems.length, model.rightItems.length, 15);
    rowH = numRows > 20 ? 44 : 52;
    tableH = numRows * rowH;
  } else {
    const dataRows = model.tableRows?.length || 0;
    numRows = Math.max(dataRows, 1);
    rowH = 52;
    // Header row + data rows + (optional footer row)
    const totalRowSlots = 1 + numRows + (model.tableFooterRow ? 1 : 0);
    tableH = totalRowSlots * rowH;
  }

  const headerH = 170; // Title, metadata line, and spacing
  const statsH = model.stats && model.stats.length > 0 ? 90 : 0;
  const footerH = 65; // Branding note and bottom margin
  const cardH = headerH + tableH + statsH + footerH;
  const height = cardH + paddingY * 2;

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Draw outer background frame (Pastel theme color)
  ctx.fillStyle = theme.frameColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw layered stationery paper effect (offset border in bottom-right)
  ctx.save();
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 1.8;
  const offset = 8;
  ctx.strokeRect(cardX + offset, cardY + offset, cardW, cardH);
  ctx.restore();

  // 3. Draw main white paper card
  ctx.save();
  ctx.fillStyle = theme.paperBg;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(cardX, cardY, cardW, cardH);
  ctx.restore();

  // 4. Header Section: Title with outlined word + bold word (Matching Reference Image)
  let currentY = cardY + 65;
  const titleX = tableX;

  ctx.save();
  // Measure Word 1
  ctx.font = '900 44px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const word1Metrics = ctx.measureText(model.titleWord1);
  const word1Width = word1Metrics.width;

  // Word 1: Hollow Outlined text (White fill + dark border stroke)
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = theme.borderColor;
  ctx.strokeText(model.titleWord1, titleX, currentY);
  ctx.fillStyle = theme.paperBg;
  ctx.fillText(model.titleWord1, titleX, currentY);

  // Word 2: Solid bold black uppercase text
  ctx.fillStyle = theme.borderColor;
  ctx.fillText(model.titleWord2, titleX + word1Width + 14, currentY);
  ctx.restore();

  // 5. Metadata Row: "Name / Class: ______" and "Date: ______"
  currentY += 46;
  ctx.save();
  ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = theme.borderColor;

  // Left metadata
  ctx.fillText(model.metadataLeft, titleX, currentY);

  // Right metadata
  const rightMetrics = ctx.measureText(model.metadataRight);
  ctx.fillText(model.metadataRight, tableX + tableW - rightMetrics.width, currentY);
  ctx.restore();

  // 6. Draw Table
  currentY += 28;
  const tableStartY = currentY;

  ctx.save();
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 1.6;

  if (layoutMode === 'dual_column') {
    // 4-Column Layout (Matching the user's reference image!):
    // Col 1: Left Number (beige)
    // Col 2: Left Content (white)
    // Col 3: Right Number (beige)
    // Col 4: Right Content (white)
    const numColW = 80;
    const contentColW = (tableW - numColW * 2) / 2;

    const col1X = tableX;
    const col2X = col1X + numColW;
    const col3X = col2X + contentColW;
    const col4X = col3X + numColW;

    for (let i = 0; i < numRows; i++) {
      const rowY = tableStartY + i * rowH;
      const leftItem: DualColumnItem | undefined = model.leftItems[i];
      const rightItem: DualColumnItem | undefined = model.rightItems[i];

      // --- Left Column ---
      // Col 1: Number Box (Beige background)
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(col1X, rowY, numColW, rowH);
      ctx.strokeRect(col1X, rowY, numColW, rowH);

      // Number text
      ctx.fillStyle = theme.textColor;
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const leftNum = leftItem?.index ?? i + 1;
      ctx.fillText(String(leftNum), col1X + numColW / 2, rowY + rowH / 2);

      // Col 2: Content Box (White background)
      ctx.fillStyle = theme.paperBg;
      ctx.fillRect(col2X, rowY, contentColW, rowH);
      ctx.strokeRect(col2X, rowY, contentColW, rowH);

      if (leftItem && leftItem.label) {
        // Draw item label
        ctx.textAlign = 'left';
        ctx.fillStyle = theme.textColor;
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        const labelText = leftItem.label;
        ctx.fillText(labelText, col2X + 16, rowY + rowH / 2);

        // Optional sublabel or roll number
        if (leftItem.subLabel) {
          ctx.font = 'normal 14px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = theme.secondaryTextColor;
          const labelW = ctx.measureText(labelText).width;
          ctx.fillText(` (${leftItem.subLabel})`, col2X + 16 + labelW, rowY + rowH / 2);
        }

        // Draw Value / Status badge on right side of cell
        if (leftItem.value) {
          ctx.textAlign = 'right';
          if (leftItem.status === 'paid') {
            ctx.fillStyle = theme.badgePaidText;
            ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
          } else if (leftItem.status === 'unpaid') {
            ctx.fillStyle = theme.badgeUnpaidText;
            ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
          } else {
            ctx.fillStyle = theme.secondaryTextColor;
            ctx.font = 'normal 16px system-ui, -apple-system, sans-serif';
          }
          ctx.fillText(leftItem.value, col2X + contentColW - 16, rowY + rowH / 2);
        }
      }

      // --- Right Column ---
      // Col 3: Number Box (Beige background)
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(col3X, rowY, numColW, rowH);
      ctx.strokeRect(col3X, rowY, numColW, rowH);

      // Number text
      ctx.fillStyle = theme.textColor;
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const rightNum = rightItem?.index ?? i + 1 + numRows;
      ctx.fillText(String(rightNum), col3X + numColW / 2, rowY + rowH / 2);

      // Col 4: Content Box (White background)
      ctx.fillStyle = theme.paperBg;
      ctx.fillRect(col4X, rowY, contentColW, rowH);
      ctx.strokeRect(col4X, rowY, contentColW, rowH);

      if (rightItem && rightItem.label) {
        // Draw item label
        ctx.textAlign = 'left';
        ctx.fillStyle = theme.textColor;
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        const labelText = rightItem.label;
        ctx.fillText(labelText, col4X + 16, rowY + rowH / 2);

        // Optional sublabel or roll number
        if (rightItem.subLabel) {
          ctx.font = 'normal 14px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = theme.secondaryTextColor;
          const labelW = ctx.measureText(labelText).width;
          ctx.fillText(` (${rightItem.subLabel})`, col4X + 16 + labelW, rowY + rowH / 2);
        }

        // Draw Value / Status badge on right side of cell
        if (rightItem.value) {
          ctx.textAlign = 'right';
          if (rightItem.status === 'paid') {
            ctx.fillStyle = theme.badgePaidText;
            ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
          } else if (rightItem.status === 'unpaid') {
            ctx.fillStyle = theme.badgeUnpaidText;
            ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
          } else {
            ctx.fillStyle = theme.secondaryTextColor;
            ctx.font = 'normal 16px system-ui, -apple-system, sans-serif';
          }
          ctx.fillText(rightItem.value, col4X + contentColW - 16, rowY + rowH / 2);
        }
      }
    }
  } else {
    // --- Summary Table Mode ---
    const headers = model.tableHeaders || ['No.', 'Item / Subject', 'Paid', 'Unpaid', 'Total'];
    const numColW = 80;
    const remainingW = tableW - numColW;
    // Columns: No (80), Title (40% of rest), Col1 (20%), Col2 (20%), Col3 (20%)
    const titleColW = remainingW * 0.4;
    const metricColW = remainingW * 0.2;

    const colXPositions = [
      tableX,
      tableX + numColW,
      tableX + numColW + titleColW,
      tableX + numColW + titleColW + metricColW,
      tableX + numColW + titleColW + metricColW * 2,
    ];
    const colWidths = [numColW, titleColW, metricColW, metricColW, metricColW];

    // 1. Table Header Row (Beige background)
    const headerRowY = tableStartY;
    for (let c = 0; c < headers.length; c++) {
      const cx = colXPositions[c];
      const cw = colWidths[c];
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(cx, headerRowY, cw, rowH);
      ctx.strokeRect(cx, headerRowY, cw, rowH);

      ctx.fillStyle = theme.textColor;
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      if (c === 0) {
        ctx.textAlign = 'center';
        ctx.fillText(headers[c], cx + cw / 2, headerRowY + rowH / 2);
      } else if (c === 1) {
        ctx.textAlign = 'left';
        ctx.fillText(headers[c], cx + 16, headerRowY + rowH / 2);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(headers[c], cx + cw - 16, headerRowY + rowH / 2);
      }
    }

    // 2. Data Rows
    const rows = model.tableRows || [];
    for (let i = 0; i < rows.length; i++) {
      const rowY = headerRowY + (i + 1) * rowH;
      const r = rows[i];

      // Col 0: No
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(colXPositions[0], rowY, colWidths[0], rowH);
      ctx.strokeRect(colXPositions[0], rowY, colWidths[0], rowH);
      ctx.fillStyle = theme.textColor;
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(r.no), colXPositions[0] + colWidths[0] / 2, rowY + rowH / 2);

      // Col 1: Title
      ctx.fillStyle = theme.paperBg;
      ctx.fillRect(colXPositions[1], rowY, colWidths[1], rowH);
      ctx.strokeRect(colXPositions[1], rowY, colWidths[1], rowH);
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(r.title, colXPositions[1] + 16, rowY + rowH / 2);

      // Col 2: Col1 (Paid)
      ctx.fillStyle = theme.paperBg;
      ctx.fillRect(colXPositions[2], rowY, colWidths[2], rowH);
      ctx.strokeRect(colXPositions[2], rowY, colWidths[2], rowH);
      ctx.fillStyle = theme.badgePaidText;
      ctx.textAlign = 'right';
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      ctx.fillText(r.col1 || '-', colXPositions[2] + colWidths[2] - 16, rowY + rowH / 2);

      // Col 3: Col2 (Unpaid)
      ctx.fillStyle = theme.paperBg;
      ctx.fillRect(colXPositions[3], rowY, colWidths[3], rowH);
      ctx.strokeRect(colXPositions[3], rowY, colWidths[3], rowH);
      ctx.fillStyle = theme.badgeUnpaidText;
      ctx.textAlign = 'right';
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      ctx.fillText(r.col2 || '-', colXPositions[3] + colWidths[3] - 16, rowY + rowH / 2);

      // Col 4: Col3 (Total)
      ctx.fillStyle = theme.paperBg;
      ctx.fillRect(colXPositions[4], rowY, colWidths[4], rowH);
      ctx.strokeRect(colXPositions[4], rowY, colWidths[4], rowH);
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'right';
      ctx.font = '900 17px system-ui, -apple-system, sans-serif';
      ctx.fillText(r.col3 || '-', colXPositions[4] + colWidths[4] - 16, rowY + rowH / 2);
    }

    // 3. Footer / Total Row
    if (model.tableFooterRow) {
      const footerRowY = headerRowY + (rows.length + 1) * rowH;
      const fr = model.tableFooterRow;

      // Span Col 0 & Col 1 as "Total"
      const totalColW = colWidths[0] + colWidths[1];
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(colXPositions[0], footerRowY, totalColW, rowH);
      ctx.strokeRect(colXPositions[0], footerRowY, totalColW, rowH);
      ctx.fillStyle = theme.textColor;
      ctx.font = '900 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fr.title || 'TOTAL', colXPositions[0] + totalColW / 2, footerRowY + rowH / 2);

      // Col 2
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(colXPositions[2], footerRowY, colWidths[2], rowH);
      ctx.strokeRect(colXPositions[2], footerRowY, colWidths[2], rowH);
      ctx.fillStyle = theme.badgePaidText;
      ctx.textAlign = 'right';
      ctx.font = '900 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(fr.col1 || '-', colXPositions[2] + colWidths[2] - 16, footerRowY + rowH / 2);

      // Col 3
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(colXPositions[3], footerRowY, colWidths[3], rowH);
      ctx.strokeRect(colXPositions[3], footerRowY, colWidths[3], rowH);
      ctx.fillStyle = theme.badgeUnpaidText;
      ctx.textAlign = 'right';
      ctx.font = '900 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(fr.col2 || '-', colXPositions[3] + colWidths[3] - 16, footerRowY + rowH / 2);

      // Col 4
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(colXPositions[4], footerRowY, colWidths[4], rowH);
      ctx.strokeRect(colXPositions[4], footerRowY, colWidths[4], rowH);
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'right';
      ctx.font = '900 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(fr.col3 || '-', colXPositions[4] + colWidths[4] - 16, footerRowY + rowH / 2);
    }
  }

  ctx.restore();

  // 7. Stats Bar (if present)
  let statsBottomY = tableStartY + tableH;
  if (model.stats && model.stats.length > 0) {
    const statsY = statsBottomY + 24;
    const statItemW = (tableW - (model.stats.length - 1) * 16) / model.stats.length;

    for (let s = 0; s < model.stats.length; s++) {
      const item = model.stats[s];
      const sx = tableX + s * (statItemW + 16);

      // Box
      ctx.save();
      ctx.fillStyle = theme.numberBg;
      ctx.fillRect(sx, statsY, statItemW, 58);
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(sx, statsY, statItemW, 58);

      // Label
      ctx.fillStyle = theme.secondaryTextColor;
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.label.toUpperCase(), sx + 14, statsY + 10);

      // Value
      ctx.fillStyle = item.color || theme.textColor;
      ctx.font = '900 19px system-ui, -apple-system, sans-serif';
      ctx.fillText(item.value, sx + 14, statsY + 30);
      ctx.restore();
    }
    statsBottomY = statsY + 58;
  }

  // 8. Footer Note / Branding
  const footerNoteY = statsBottomY + 36;
  ctx.save();
  ctx.font = 'italic 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = theme.secondaryTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const footerText =
    model.footerNote || 'EC Treasury Management System • Confidential Class Report';
  ctx.fillText(footerText, cardX + cardW / 2, footerNoteY);
  ctx.restore();

  // Export to Blob & DataURL
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });

  return {
    dataUrl,
    blob: blob || undefined,
    width,
    height,
  };
}

/**
 * Downloads a PNG data URL in web and desktop browsers.
 */
export function downloadAestheticReportPNG(dataUrl: string, filename: string): boolean {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
  return false;
}

/**
 * Copies the image directly to the system clipboard (supported on modern Web & Desktop).
 */
export async function copyAestheticReportImage(blob?: Blob): Promise<boolean> {
  if (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    (window as any).ClipboardItem &&
    blob
  ) {
    try {
      const item = new (window as any).ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    } catch (e) {
      console.warn('Clipboard image write failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Shares an aesthetic image report on mobile via expo-sharing or web via Web Share API.
 */
export async function shareAestheticReportImage(
  filename: string,
  base64Png: string,
  blob?: Blob
): Promise<boolean> {
  // 1. Try Web Share API with File
  if (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    blob
  ) {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Aesthetic Report',
          text: 'EC Treasury Report',
        });
        return true;
      }
    } catch (e) {
      // User may have cancelled or permission denied
      console.log('Web share skipped or cancelled:', e);
    }
  }

  // 2. Try Native Expo Sharing
  if (Platform.OS !== 'web') {
    try {
      const Sharing = require('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;

      const FileSystem = require('expo-file-system/legacy');
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const base64Data = base64Png.replace(/^data:image\/\w+;base64,/, '');

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Aesthetic Report Image',
      });
      return true;
    } catch (e) {
      console.error('Failed to share native image:', e);
      return false;
    }
  }

  return false;
}

/**
 * Generates an SVG string representation of the aesthetic report.
 * Provides high-fidelity vector output that can be saved as .svg or embedded anywhere.
 */
export function generateAestheticReportSVG(model: AestheticReportModel): string {
  const { theme, layoutMode } = model;
  const width = 1200;
  const paddingX = 40;
  const paddingY = 44;
  const cardX = paddingX;
  const cardY = paddingY;
  const cardW = width - paddingX * 2;

  const innerMargin = 36;
  const tableX = cardX + innerMargin;
  const tableW = cardW - innerMargin * 2;

  let tableH = 0;
  let rowH = 50;
  let numRows = 0;

  if (layoutMode === 'dual_column') {
    numRows = Math.max(model.leftItems.length, model.rightItems.length, 15);
    rowH = numRows > 20 ? 44 : 52;
    tableH = numRows * rowH;
  } else {
    const dataRows = model.tableRows?.length || 0;
    numRows = Math.max(dataRows, 1);
    rowH = 52;
    const totalRowSlots = 1 + numRows + (model.tableFooterRow ? 1 : 0);
    tableH = totalRowSlots * rowH;
  }

  const headerH = 170;
  const statsH = model.stats && model.stats.length > 0 ? 90 : 0;
  const footerH = 65;
  const cardH = headerH + tableH + statsH + footerH;
  const height = cardH + paddingY * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `  <style>\n`;
  svg += `    text { font-family: system-ui, -apple-system, sans-serif; }\n`;
  svg += `    .title-outline { font-size: 44px; font-weight: 900; fill: ${theme.paperBg}; stroke: ${theme.borderColor}; stroke-width: 4px; stroke-linejoin: round; }\n`;
  svg += `    .title-solid { font-size: 44px; font-weight: 900; fill: ${theme.borderColor}; }\n`;
  svg += `    .meta-text { font-size: 20px; font-weight: bold; fill: ${theme.borderColor}; }\n`;
  svg += `    .num-text { font-size: 20px; font-weight: bold; fill: ${theme.textColor}; text-anchor: middle; }\n`;
  svg += `    .item-text { font-size: 18px; font-weight: bold; fill: ${theme.textColor}; }\n`;
  svg += `    .sub-text { font-size: 14px; fill: ${theme.secondaryTextColor}; }\n`;
  svg += `    .paid-text { font-size: 16px; font-weight: bold; fill: ${theme.badgePaidText}; text-anchor: end; }\n`;
  svg += `    .unpaid-text { font-size: 16px; font-weight: bold; fill: ${theme.badgeUnpaidText}; text-anchor: end; }\n`;
  svg += `    .neutral-text { font-size: 16px; font-weight: normal; fill: ${theme.secondaryTextColor}; text-anchor: end; }\n`;
  svg += `    .footer-text { font-size: 15px; font-style: italic; fill: ${theme.secondaryTextColor}; text-anchor: middle; }\n`;
  svg += `  </style>\n`;

  // Background frame
  svg += `  <rect x="0" y="0" width="${width}" height="${height}" fill="${theme.frameColor}"/>\n`;

  // Stacked paper offset
  svg += `  <rect x="${cardX + 8}" y="${cardY + 8}" width="${cardW}" height="${cardH}" fill="none" stroke="${theme.borderColor}" stroke-width="1.8"/>\n`;

  // Main white card
  svg += `  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" fill="${theme.paperBg}" stroke="${theme.borderColor}" stroke-width="2.5"/>\n`;

  // Header Title
  const titleY = cardY + 65;
  svg += `  <g transform="translate(${tableX}, ${titleY})">\n`;
  svg += `    <text class="title-outline" x="0" y="0">${escapeXML(model.titleWord1)}</text>\n`;
  // Approximate offset for word2
  const approxWord1W = model.titleWord1.length * 28 + 10;
  svg += `    <text class="title-solid" x="${approxWord1W}" y="0">${escapeXML(model.titleWord2)}</text>\n`;
  svg += `  </g>\n`;

  // Metadata Row
  const metaY = titleY + 46;
  svg += `  <text class="meta-text" x="${tableX}" y="${metaY}">${escapeXML(model.metadataLeft)}</text>\n`;
  svg += `  <text class="meta-text" x="${tableX + tableW}" y="${metaY}" text-anchor="end">${escapeXML(model.metadataRight)}</text>\n`;

  // Table
  const tableStartY = metaY + 28;

  if (layoutMode === 'dual_column') {
    const numColW = 80;
    const contentColW = (tableW - numColW * 2) / 2;
    const col1X = tableX;
    const col2X = col1X + numColW;
    const col3X = col2X + contentColW;
    const col4X = col3X + numColW;

    for (let i = 0; i < numRows; i++) {
      const rowY = tableStartY + i * rowH;
      const leftItem = model.leftItems[i];
      const rightItem = model.rightItems[i];
      const leftNum = leftItem?.index ?? i + 1;
      const rightNum = rightItem?.index ?? i + 1 + numRows;

      // Col 1
      svg += `  <rect x="${col1X}" y="${rowY}" width="${numColW}" height="${rowH}" fill="${theme.numberBg}" stroke="${theme.borderColor}" stroke-width="1.6"/>\n`;
      svg += `  <text class="num-text" x="${col1X + numColW / 2}" y="${rowY + rowH / 2 + 7}">${leftNum}</text>\n`;

      // Col 2
      svg += `  <rect x="${col2X}" y="${rowY}" width="${contentColW}" height="${rowH}" fill="${theme.paperBg}" stroke="${theme.borderColor}" stroke-width="1.6"/>\n`;
      if (leftItem && leftItem.label) {
        svg += `  <text class="item-text" x="${col2X + 16}" y="${rowY + rowH / 2 + 6}">${escapeXML(leftItem.label)}${leftItem.subLabel ? ` <tspan class="sub-text">(${escapeXML(leftItem.subLabel)})</tspan>` : ''}</text>\n`;
        if (leftItem.value) {
          const valClass = leftItem.status === 'paid' ? 'paid-text' : leftItem.status === 'unpaid' ? 'unpaid-text' : 'neutral-text';
          svg += `  <text class="${valClass}" x="${col2X + contentColW - 16}" y="${rowY + rowH / 2 + 6}">${escapeXML(leftItem.value)}</text>\n`;
        }
      }

      // Col 3
      svg += `  <rect x="${col3X}" y="${rowY}" width="${numColW}" height="${rowH}" fill="${theme.numberBg}" stroke="${theme.borderColor}" stroke-width="1.6"/>\n`;
      svg += `  <text class="num-text" x="${col3X + numColW / 2}" y="${rowY + rowH / 2 + 7}">${rightNum}</text>\n`;

      // Col 4
      svg += `  <rect x="${col4X}" y="${rowY}" width="${contentColW}" height="${rowH}" fill="${theme.paperBg}" stroke="${theme.borderColor}" stroke-width="1.6"/>\n`;
      if (rightItem && rightItem.label) {
        svg += `  <text class="item-text" x="${col4X + 16}" y="${rowY + rowH / 2 + 6}">${escapeXML(rightItem.label)}${rightItem.subLabel ? ` <tspan class="sub-text">(${escapeXML(rightItem.subLabel)})</tspan>` : ''}</text>\n`;
        if (rightItem.value) {
          const valClass = rightItem.status === 'paid' ? 'paid-text' : rightItem.status === 'unpaid' ? 'unpaid-text' : 'neutral-text';
          svg += `  <text class="${valClass}" x="${col4X + contentColW - 16}" y="${rowY + rowH / 2 + 6}">${escapeXML(rightItem.value)}</text>\n`;
        }
      }
    }
  }

  // Footer Note
  const footerNoteY = cardY + cardH - 30;
  svg += `  <text class="footer-text" x="${cardX + cardW / 2}" y="${footerNoteY}">${escapeXML(model.footerNote || 'EC Treasury Management System • Confidential Class Report')}</text>\n`;

  svg += `</svg>`;
  return svg;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
