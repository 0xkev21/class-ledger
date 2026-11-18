import React, { forwardRef } from 'react';
import Svg, {
  G,
  Line,
  Rect,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';
import {
  AestheticReportModel,
  DualColumnItem,
  SummaryTableRow,
} from '../types/imageReport';

interface AestheticSvgReportProps {
  model: AestheticReportModel;
  style?: any;
}

export const AestheticSvgReport = forwardRef<any, AestheticSvgReportProps>(
  ({ model, style }, ref) => {
    const { theme, layoutMode } = model;

    // Standard high-DPI coordinates
    const width = 1200;
    const paddingX = 40;
    const paddingY = 44;
    const cardX = paddingX;
    const cardY = paddingY;
    const cardW = width - paddingX * 2; // 1120

    const innerMargin = 36;
    const tableX = cardX + innerMargin;
    const tableW = cardW - innerMargin * 2; // 1048

    let tableH = 0;
    let rowH = 52;
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

    const titleY = cardY + 65;
    const metaY = titleY + 46;
    const tableStartY = metaY + 28;

    // Approximate width of Word 1 for positioning Word 2
    const approxWord1W = model.titleWord1.length * 28 + 14;

    return (
      <Svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={[{ aspectRatio: width / height }, style]}
      >
        {/* 1. Background frame */}
        <Rect x={0} y={0} width={width} height={height} fill={theme.frameColor} />

        {/* 2. Stacked paper layer illusion */}
        <Rect
          x={cardX + 8}
          y={cardY + 8}
          width={cardW}
          height={cardH}
          fill="none"
          stroke={theme.borderColor}
          strokeWidth={1.8}
        />

        {/* 3. Main white card */}
        <Rect
          x={cardX}
          y={cardY}
          width={cardW}
          height={cardH}
          fill={theme.paperBg}
          stroke={theme.borderColor}
          strokeWidth={2.5}
        />

        {/* 4. Header Section: Title */}
        <G>
          {/* Word 1: Outlined (White fill with stroke) */}
          <SvgText
            x={tableX}
            y={titleY}
            fill={theme.paperBg}
            stroke={theme.borderColor}
            strokeWidth={3.5}
            fontSize={44}
            fontWeight="900"
          >
            {model.titleWord1.toUpperCase()}
          </SvgText>

          {/* Word 2: Solid bold black */}
          <SvgText
            x={tableX + approxWord1W}
            y={titleY}
            fill={theme.borderColor}
            fontSize={44}
            fontWeight="900"
          >
            {model.titleWord2.toUpperCase()}
          </SvgText>
        </G>

        {/* 5. Metadata Row */}
        <SvgText
          x={tableX}
          y={metaY}
          fill={theme.borderColor}
          fontSize={20}
          fontWeight="bold"
        >
          {model.metadataLeft}
        </SvgText>
        <SvgText
          x={tableX + tableW}
          y={metaY}
          fill={theme.borderColor}
          fontSize={20}
          fontWeight="bold"
          textAnchor="end"
        >
          {model.metadataRight}
        </SvgText>

        {/* 6. Table Area */}
        {layoutMode === 'dual_column' ? (
          /* Dual-Column 4-Grid Table (Reference Worksheet Style) */
          (() => {
            const numColW = 80;
            const contentColW = (tableW - numColW * 2) / 2;
            const col1X = tableX;
            const col2X = col1X + numColW;
            const col3X = col2X + contentColW;
            const col4X = col3X + numColW;

            return (
              <G>
                {Array.from({ length: numRows }).map((_, i) => {
                  const rowY = tableStartY + i * rowH;
                  const leftItem: DualColumnItem | undefined = model.leftItems[i];
                  const rightItem: DualColumnItem | undefined = model.rightItems[i];
                  const leftNum = leftItem?.index ?? i + 1;
                  const rightNum = rightItem?.index ?? i + 1 + numRows;

                  return (
                    <G key={`drow-${i}`}>
                      {/* Col 1: Left Number */}
                      <Rect
                        x={col1X}
                        y={rowY}
                        width={numColW}
                        height={rowH}
                        fill={theme.numberBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={col1X + numColW / 2}
                        y={rowY + rowH / 2 + 7}
                        fill={theme.textColor}
                        fontSize={20}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {leftNum}
                      </SvgText>

                      {/* Col 2: Left Content */}
                      <Rect
                        x={col2X}
                        y={rowY}
                        width={contentColW}
                        height={rowH}
                        fill={theme.paperBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      {leftItem && leftItem.label ? (
                        <>
                          <SvgText
                            x={col2X + 16}
                            y={rowY + rowH / 2 + 6}
                            fill={theme.textColor}
                            fontSize={18}
                            fontWeight="bold"
                          >
                            {leftItem.label}
                            {leftItem.subLabel ? (
                              <TSpan
                                fill={theme.secondaryTextColor}
                                fontSize={14}
                                fontWeight="normal"
                              >
                                {` (${leftItem.subLabel})`}
                              </TSpan>
                            ) : null}
                          </SvgText>
                          {leftItem.value ? (
                            <SvgText
                              x={col2X + contentColW - 16}
                              y={rowY + rowH / 2 + 6}
                              fill={
                                leftItem.status === 'paid'
                                  ? theme.badgePaidText
                                  : leftItem.status === 'unpaid'
                                  ? theme.badgeUnpaidText
                                  : theme.secondaryTextColor
                              }
                              fontSize={16}
                              fontWeight={leftItem.status === 'neutral' ? 'normal' : 'bold'}
                              textAnchor="end"
                            >
                              {leftItem.value}
                            </SvgText>
                          ) : null}
                        </>
                      ) : null}

                      {/* Col 3: Right Number */}
                      <Rect
                        x={col3X}
                        y={rowY}
                        width={numColW}
                        height={rowH}
                        fill={theme.numberBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={col3X + numColW / 2}
                        y={rowY + rowH / 2 + 7}
                        fill={theme.textColor}
                        fontSize={20}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {rightNum}
                      </SvgText>

                      {/* Col 4: Right Content */}
                      <Rect
                        x={col4X}
                        y={rowY}
                        width={contentColW}
                        height={rowH}
                        fill={theme.paperBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      {rightItem && rightItem.label ? (
                        <>
                          <SvgText
                            x={col4X + 16}
                            y={rowY + rowH / 2 + 6}
                            fill={theme.textColor}
                            fontSize={18}
                            fontWeight="bold"
                          >
                            {rightItem.label}
                            {rightItem.subLabel ? (
                              <TSpan
                                fill={theme.secondaryTextColor}
                                fontSize={14}
                                fontWeight="normal"
                              >
                                {` (${rightItem.subLabel})`}
                              </TSpan>
                            ) : null}
                          </SvgText>
                          {rightItem.value ? (
                            <SvgText
                              x={col4X + contentColW - 16}
                              y={rowY + rowH / 2 + 6}
                              fill={
                                rightItem.status === 'paid'
                                  ? theme.badgePaidText
                                  : rightItem.status === 'unpaid'
                                  ? theme.badgeUnpaidText
                                  : theme.secondaryTextColor
                              }
                              fontSize={16}
                              fontWeight={rightItem.status === 'neutral' ? 'normal' : 'bold'}
                              textAnchor="end"
                            >
                              {rightItem.value}
                            </SvgText>
                          ) : null}
                        </>
                      ) : null}
                    </G>
                  );
                })}
              </G>
            );
          })()
        ) : (
          /* Structured Summary Table Mode */
          (() => {
            const headers =
              model.tableHeaders || ['No.', 'Item / Subject', 'Paid', 'Unpaid', 'Total'];
            const numColW = 80;
            const remainingW = tableW - numColW;
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

            const headerRowY = tableStartY;
            const rows = model.tableRows || [];

            return (
              <G>
                {/* Header Row */}
                {headers.map((h, c) => (
                  <G key={`th-${c}`}>
                    <Rect
                      x={colXPositions[c]}
                      y={headerRowY}
                      width={colWidths[c]}
                      height={rowH}
                      fill={theme.numberBg}
                      stroke={theme.borderColor}
                      strokeWidth={1.5}
                    />
                    <SvgText
                      x={
                        c === 0
                          ? colXPositions[c] + colWidths[c] / 2
                          : c === 1
                          ? colXPositions[c] + 16
                          : colXPositions[c] + colWidths[c] - 16
                      }
                      y={headerRowY + rowH / 2 + 6}
                      fill={theme.textColor}
                      fontSize={18}
                      fontWeight="bold"
                      textAnchor={c === 0 ? 'middle' : c === 1 ? 'start' : 'end'}
                    >
                      {h}
                    </SvgText>
                  </G>
                ))}

                {/* Data Rows */}
                {rows.map((r, rIdx) => {
                  const rowY = headerRowY + (rIdx + 1) * rowH;
                  return (
                    <G key={`tr-${rIdx}`}>
                      {/* Col 0: No */}
                      <Rect
                        x={colXPositions[0]}
                        y={rowY}
                        width={colWidths[0]}
                        height={rowH}
                        fill={theme.numberBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={colXPositions[0] + colWidths[0] / 2}
                        y={rowY + rowH / 2 + 6}
                        fill={theme.textColor}
                        fontSize={18}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {r.no}
                      </SvgText>

                      {/* Col 1: Title */}
                      <Rect
                        x={colXPositions[1]}
                        y={rowY}
                        width={colWidths[1]}
                        height={rowH}
                        fill={theme.paperBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={colXPositions[1] + 16}
                        y={rowY + rowH / 2 + 6}
                        fill={theme.textColor}
                        fontSize={18}
                        fontWeight="bold"
                      >
                        {r.title}
                      </SvgText>

                      {/* Col 2: Metric 1 (Paid / Status) */}
                      <Rect
                        x={colXPositions[2]}
                        y={rowY}
                        width={colWidths[2]}
                        height={rowH}
                        fill={theme.paperBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={colXPositions[2] + colWidths[2] - 16}
                        y={rowY + rowH / 2 + 6}
                        fill={theme.badgePaidText}
                        fontSize={17}
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        {r.col1 || '-'}
                      </SvgText>

                      {/* Col 3: Metric 2 (Unpaid / Date) */}
                      <Rect
                        x={colXPositions[3]}
                        y={rowY}
                        width={colWidths[3]}
                        height={rowH}
                        fill={theme.paperBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={colXPositions[3] + colWidths[3] - 16}
                        y={rowY + rowH / 2 + 6}
                        fill={theme.badgeUnpaidText}
                        fontSize={17}
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        {r.col2 || '-'}
                      </SvgText>

                      {/* Col 4: Metric 3 (Total / Amount) */}
                      <Rect
                        x={colXPositions[4]}
                        y={rowY}
                        width={colWidths[4]}
                        height={rowH}
                        fill={theme.paperBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={colXPositions[4] + colWidths[4] - 16}
                        y={rowY + rowH / 2 + 6}
                        fill={theme.textColor}
                        fontSize={18}
                        fontWeight="900"
                        textAnchor="end"
                      >
                        {r.col3 || '-'}
                      </SvgText>
                    </G>
                  );
                })}

                {/* Footer Total Row */}
                {model.tableFooterRow ? (
                  (() => {
                    const footerRowY = headerRowY + (rows.length + 1) * rowH;
                    const fr = model.tableFooterRow;
                    const totalColW = colWidths[0] + colWidths[1];

                    return (
                      <G>
                        <Rect
                          x={colXPositions[0]}
                          y={footerRowY}
                          width={totalColW}
                          height={rowH}
                          fill={theme.numberBg}
                          stroke={theme.borderColor}
                          strokeWidth={1.5}
                        />
                        <SvgText
                          x={colXPositions[0] + totalColW / 2}
                          y={footerRowY + rowH / 2 + 6}
                          fill={theme.textColor}
                          fontSize={19}
                          fontWeight="900"
                          textAnchor="middle"
                        >
                          {fr.title || 'TOTAL'}
                        </SvgText>

                        {/* Col 2 */}
                        <Rect
                          x={colXPositions[2]}
                          y={footerRowY}
                          width={colWidths[2]}
                          height={rowH}
                          fill={theme.numberBg}
                          stroke={theme.borderColor}
                          strokeWidth={1.5}
                        />
                        <SvgText
                          x={colXPositions[2] + colWidths[2] - 16}
                          y={footerRowY + rowH / 2 + 6}
                          fill={theme.badgePaidText}
                          fontSize={18}
                          fontWeight="900"
                          textAnchor="end"
                        >
                          {fr.col1 || '-'}
                        </SvgText>

                        {/* Col 3 */}
                        <Rect
                          x={colXPositions[3]}
                          y={footerRowY}
                          width={colWidths[3]}
                          height={rowH}
                          fill={theme.numberBg}
                          stroke={theme.borderColor}
                          strokeWidth={1.5}
                        />
                        <SvgText
                          x={colXPositions[3] + colWidths[3] - 16}
                          y={footerRowY + rowH / 2 + 6}
                          fill={theme.badgeUnpaidText}
                          fontSize={18}
                          fontWeight="900"
                          textAnchor="end"
                        >
                          {fr.col2 || '-'}
                        </SvgText>

                        {/* Col 4 */}
                        <Rect
                          x={colXPositions[4]}
                          y={footerRowY}
                          width={colWidths[4]}
                          height={rowH}
                          fill={theme.numberBg}
                          stroke={theme.borderColor}
                          strokeWidth={1.5}
                        />
                        <SvgText
                          x={colXPositions[4] + colWidths[4] - 16}
                          y={footerRowY + rowH / 2 + 6}
                          fill={theme.textColor}
                          fontSize={18}
                          fontWeight="900"
                          textAnchor="end"
                        >
                          {fr.col3 || '-'}
                        </SvgText>
                      </G>
                    );
                  })()
                ) : null}
              </G>
            );
          })()
        )}

        {/* 7. Stats Bar */}
        {model.stats && model.stats.length > 0 ? (
          (() => {
            const statsY = tableStartY + tableH + 24;
            const statItemW = (tableW - (model.stats.length - 1) * 16) / model.stats.length;

            return (
              <G>
                {model.stats.map((item, s) => {
                  const sx = tableX + s * (statItemW + 16);
                  return (
                    <G key={`stat-${s}`}>
                      <Rect
                        x={sx}
                        y={statsY}
                        width={statItemW}
                        height={58}
                        fill={theme.numberBg}
                        stroke={theme.borderColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={sx + 14}
                        y={statsY + 20}
                        fill={theme.secondaryTextColor}
                        fontSize={13}
                        fontWeight="bold"
                      >
                        {item.label.toUpperCase()}
                      </SvgText>
                      <SvgText
                        x={sx + 14}
                        y={statsY + 44}
                        fill={item.color || theme.textColor}
                        fontSize={19}
                        fontWeight="900"
                      >
                        {item.value}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            );
          })()
        ) : null}

        {/* 8. Footer Note */}
        <SvgText
          x={cardX + cardW / 2}
          y={cardY + cardH - 26}
          fill={theme.secondaryTextColor}
          fontSize={15}
          fontStyle="italic"
          textAnchor="middle"
        >
          {model.footerNote ||
            'Class Ledger Management System • Confidential Class Report'}
        </SvgText>
      </Svg>
    );
  }
);
AestheticSvgReport.displayName = 'AestheticSvgReport';
