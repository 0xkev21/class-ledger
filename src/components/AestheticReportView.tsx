import React from 'react';
import { Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import {
  AestheticReportModel,
  DualColumnItem,
  SummaryTableRow,
} from '../types/imageReport';

interface AestheticReportViewProps {
  model: AestheticReportModel;
  scale?: number;
}

export const AestheticReportView: React.FC<AestheticReportViewProps> = ({
  model,
}) => {
  const { theme, layoutMode } = model;
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 640;

  const numRows =
    layoutMode === 'dual_column'
      ? Math.max(model.leftItems.length, model.rightItems.length, 15)
      : Math.max(model.tableRows?.length || 0, 1);

  const containerPadding = isMobile ? 10 : 18;
  const sheetPadding = isMobile ? 12 : 18;

  return (
    <View
      style={{
        backgroundColor: theme.frameColor,
        padding: containerPadding,
        borderRadius: 4,
      }}
      className="w-full select-none"
    >
      {/* Container with Stacked Paper Layer Illusion */}
      <View style={{ position: 'relative' }}>
        {/* Offset Paper Layer (Bottom-Right Shadow Effect) */}
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            right: -5,
            bottom: -5,
            borderWidth: 1.5,
            borderColor: theme.borderColor,
            backgroundColor: 'transparent',
            zIndex: 1,
          }}
        />

        {/* Main White Sheet */}
        <View
          style={{
            backgroundColor: theme.paperBg,
            borderWidth: 2,
            borderColor: theme.borderColor,
            padding: sheetPadding,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Header Title: Outline Word + Solid Bold Word (Reference Image Style) */}
          <View className="flex-row items-center flex-wrap mb-3">
            {/* Outline Word */}
            <Text
              style={{
                fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBlack' : 'sans-serif',
                fontWeight: '900',
                fontSize: isMobile ? 20 : 26,
                letterSpacing: 1.2,
                color: '#ffffff',
                ...(Platform.OS === 'web'
                  ? ({
                      WebkitTextStroke: `1.8px ${theme.borderColor}`,
                      WebkitTextFillColor: '#ffffff',
                      textShadow: `0 0 1px ${theme.borderColor}`,
                    } as any)
                  : {
                      textShadowColor: theme.borderColor,
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 1,
                    }),
              }}
            >
              {model.titleWord1.toUpperCase()}{' '}
            </Text>

            {/* Solid Bold Word */}
            <Text
              style={{
                fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBlack' : 'sans-serif',
                fontWeight: '900',
                fontSize: isMobile ? 20 : 26,
                letterSpacing: 1.2,
                color: theme.borderColor,
              }}
            >
              {model.titleWord2.toUpperCase()}
            </Text>
          </View>

          {/* Metadata Row: Name / Class & Date */}
          <View
            style={{
              paddingBottom: 8,
              marginBottom: 10,
            }}
            className="flex-row items-center justify-between"
          >
            <Text
              numberOfLines={1}
              style={{ color: theme.borderColor }}
              className="text-[11px] font-bold tracking-tight flex-1 mr-2"
            >
              {model.metadataLeft}
            </Text>
            <Text
              style={{ color: theme.borderColor }}
              className="text-[11px] font-bold tracking-tight shrink-0"
            >
              {model.metadataRight}
            </Text>
          </View>

          {/* Table Area */}
          {layoutMode === 'dual_column' ? (
            /* 4-Column Continuous Grid Layout (Matching User Reference Image) */
            <View
              style={{
                borderWidth: 1.5,
                borderColor: theme.borderColor,
              }}
            >
              {Array.from({ length: numRows }).map((_, index) => {
                const leftItem: DualColumnItem | undefined = model.leftItems[index];
                const rightItem: DualColumnItem | undefined = model.rightItems[index];
                const leftNum = leftItem?.index ?? index + 1;
                const rightNum = rightItem?.index ?? index + 1 + numRows;
                const isLastRow = index === numRows - 1;

                return (
                  <View
                    key={`row-${index}`}
                    style={{
                      borderBottomWidth: isLastRow ? 0 : 1.2,
                      borderColor: theme.borderColor,
                      minHeight: isMobile ? 28 : 32,
                    }}
                    className="flex-row items-stretch"
                  >
                    {/* Col 1: Left Number (Beige Tint) */}
                    <View
                      style={{
                        width: isMobile ? 26 : 38,
                        backgroundColor: theme.numberBg,
                        borderRightWidth: 1.2,
                        borderColor: theme.borderColor,
                      }}
                      className="items-center justify-center px-0.5"
                    >
                      <Text
                        style={{ color: theme.textColor }}
                        className="text-[10px] md:text-[11px] font-extrabold"
                      >
                        {leftNum}
                      </Text>
                    </View>

                    {/* Col 2: Left Content (White) */}
                    <View
                      style={{
                        backgroundColor: theme.paperBg,
                        borderRightWidth: 1.5,
                        borderColor: theme.borderColor,
                      }}
                      className="flex-1 flex-row items-center justify-between px-1.5 md:px-2.5 py-0.5"
                    >
                      {leftItem && leftItem.label ? (
                        <>
                          <View className="flex-row items-center flex-1 mr-1 overflow-hidden">
                            <Text
                              numberOfLines={1}
                              style={{ color: theme.textColor }}
                              className="text-[11px] md:text-xs font-bold mr-0.5"
                            >
                              {leftItem.label}
                            </Text>
                            {leftItem.subLabel ? (
                              <Text
                                numberOfLines={1}
                                style={{ color: theme.secondaryTextColor }}
                                className="text-[9px] md:text-[10px]"
                              >
                                ({leftItem.subLabel})
                              </Text>
                            ) : null}
                          </View>
                          {leftItem.value ? (
                            <Text
                              style={{
                                color:
                                  leftItem.status === 'paid'
                                    ? theme.badgePaidText
                                    : leftItem.status === 'unpaid'
                                    ? theme.badgeUnpaidText
                                    : theme.secondaryTextColor,
                                fontVariant: ['tabular-nums'],
                              }}
                              className={`text-[10px] md:text-[11px] ${
                                leftItem.status === 'neutral' ? 'font-medium' : 'font-bold'
                              } shrink-0 ml-0.5`}
                            >
                              {leftItem.value}
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        <View style={{ height: 14 }} />
                      )}
                    </View>

                    {/* Col 3: Right Number (Beige Tint) */}
                    <View
                      style={{
                        width: isMobile ? 26 : 38,
                        backgroundColor: theme.numberBg,
                        borderRightWidth: 1.2,
                        borderColor: theme.borderColor,
                      }}
                      className="items-center justify-center px-0.5"
                    >
                      <Text
                        style={{ color: theme.textColor }}
                        className="text-[10px] md:text-[11px] font-extrabold"
                      >
                        {rightNum}
                      </Text>
                    </View>

                    {/* Col 4: Right Content (White) */}
                    <View
                      style={{
                        backgroundColor: theme.paperBg,
                      }}
                      className="flex-1 flex-row items-center justify-between px-1.5 md:px-2.5 py-0.5"
                    >
                      {rightItem && rightItem.label ? (
                        <>
                          <View className="flex-row items-center flex-1 mr-1 overflow-hidden">
                            <Text
                              numberOfLines={1}
                              style={{ color: theme.textColor }}
                              className="text-[11px] md:text-xs font-bold mr-0.5"
                            >
                              {rightItem.label}
                            </Text>
                            {rightItem.subLabel ? (
                              <Text
                                numberOfLines={1}
                                style={{ color: theme.secondaryTextColor }}
                                className="text-[9px] md:text-[10px]"
                              >
                                ({rightItem.subLabel})
                              </Text>
                            ) : null}
                          </View>
                          {rightItem.value ? (
                            <Text
                              style={{
                                color:
                                  rightItem.status === 'paid'
                                    ? theme.badgePaidText
                                    : rightItem.status === 'unpaid'
                                    ? theme.badgeUnpaidText
                                    : theme.secondaryTextColor,
                                fontVariant: ['tabular-nums'],
                              }}
                              className={`text-[10px] md:text-[11px] ${
                                rightItem.status === 'neutral' ? 'font-medium' : 'font-bold'
                              } shrink-0 ml-0.5`}
                            >
                              {rightItem.value}
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        <View style={{ height: 14 }} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Summary Table Mode (Header row + data rows + total row) */
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: theme.borderColor,
                  minWidth: isMobile ? 320 : '100%',
                }}
              >
                {/* Header Row */}
                <View
                  style={{
                    backgroundColor: theme.numberBg,
                    borderBottomWidth: 1.5,
                    borderColor: theme.borderColor,
                  }}
                  className="flex-row items-center"
                >
                  <View
                    style={{
                      width: isMobile ? 28 : 38,
                      borderRightWidth: 1.2,
                      borderColor: theme.borderColor,
                    }}
                    className="items-center justify-center py-2"
                  >
                    <Text
                      style={{ color: theme.textColor }}
                      className="text-[10px] md:text-[11px] font-bold"
                    >
                      {model.tableHeaders?.[0] || 'No.'}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRightWidth: 1.2,
                      borderColor: theme.borderColor,
                      minWidth: isMobile ? 95 : 140,
                    }}
                    className="flex-1 px-2.5 py-2"
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.textColor }}
                      className="text-[10px] md:text-[11px] font-bold"
                    >
                      {model.tableHeaders?.[1] || 'Item / Subject'}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: isMobile ? 55 : 75,
                      borderRightWidth: 1.2,
                      borderColor: theme.borderColor,
                    }}
                    className="px-1.5 py-2 items-end"
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.textColor }}
                      className="text-[10px] md:text-[11px] font-bold"
                    >
                      {model.tableHeaders?.[2] || 'Paid'}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: isMobile ? 58 : 75,
                      borderRightWidth: 1.2,
                      borderColor: theme.borderColor,
                    }}
                    className="px-1.5 py-2 items-end"
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.textColor }}
                      className="text-[10px] md:text-[11px] font-bold"
                    >
                      {model.tableHeaders?.[3] || 'Unpaid'}
                    </Text>
                  </View>
                  <View
                    style={{ width: isMobile ? 72 : 85 }}
                    className="px-1.5 py-2 items-end"
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.textColor }}
                      className="text-[10px] md:text-[11px] font-bold"
                    >
                      {model.tableHeaders?.[4] || 'Total'}
                    </Text>
                  </View>
                </View>

                {/* Data Rows */}
                {(model.tableRows || []).map((row, rIdx) => {
                  const isLast =
                    rIdx === (model.tableRows?.length || 0) - 1 && !model.tableFooterRow;
                  return (
                    <View
                      key={`trow-${rIdx}`}
                      style={{
                        borderBottomWidth: isLast ? 0 : 1.2,
                        borderColor: theme.borderColor,
                        backgroundColor: theme.paperBg,
                      }}
                      className="flex-row items-center"
                    >
                      <View
                        style={{
                          width: isMobile ? 28 : 38,
                          backgroundColor: theme.numberBg,
                          borderRightWidth: 1.2,
                          borderColor: theme.borderColor,
                        }}
                        className="items-center justify-center py-1.5 md:py-2"
                      >
                        <Text
                          style={{ color: theme.textColor }}
                          className="text-[10px] md:text-[11px] font-bold"
                        >
                          {row.no}
                        </Text>
                      </View>
                      <View
                        style={{
                          borderRightWidth: 1.2,
                          borderColor: theme.borderColor,
                          minWidth: isMobile ? 95 : 140,
                        }}
                        className="flex-1 px-2.5 py-1.5 md:py-2"
                      >
                        <Text
                          numberOfLines={1}
                          style={{ color: theme.textColor }}
                          className="text-[11px] md:text-xs font-bold"
                        >
                          {row.title}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: isMobile ? 55 : 75,
                          borderRightWidth: 1.2,
                          borderColor: theme.borderColor,
                        }}
                        className="px-1.5 py-1.5 md:py-2 items-end"
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: theme.badgePaidText,
                            fontVariant: ['tabular-nums'],
                          }}
                          className="text-[10px] md:text-[11px] font-bold"
                        >
                          {row.col1 || '-'}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: isMobile ? 58 : 75,
                          borderRightWidth: 1.2,
                          borderColor: theme.borderColor,
                        }}
                        className="px-1.5 py-1.5 md:py-2 items-end"
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: theme.badgeUnpaidText,
                            fontVariant: ['tabular-nums'],
                          }}
                          className="text-[10px] md:text-[11px] font-bold"
                        >
                          {row.col2 || '-'}
                        </Text>
                      </View>
                      <View
                        style={{ width: isMobile ? 72 : 85 }}
                        className="px-1.5 py-1.5 md:py-2 items-end"
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: theme.textColor,
                            fontVariant: ['tabular-nums'],
                          }}
                          className="text-[11px] md:text-xs font-extrabold"
                        >
                          {row.col3 || '-'}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Footer Total Row */}
                {model.tableFooterRow ? (
                  <View
                    style={{
                      backgroundColor: theme.numberBg,
                      borderTopWidth: 1.5,
                      borderColor: theme.borderColor,
                    }}
                    className="flex-row items-center"
                  >
                    <View
                      style={{
                        borderRightWidth: 1.2,
                        borderColor: theme.borderColor,
                        minWidth: (isMobile ? 28 : 38) + (isMobile ? 95 : 140),
                      }}
                      className="flex-1 px-2.5 py-2 items-center justify-center"
                    >
                      <Text
                        style={{ color: theme.textColor }}
                        className="text-[11px] md:text-xs font-black tracking-wider uppercase"
                      >
                        {model.tableFooterRow.title || 'TOTAL'}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: isMobile ? 55 : 75,
                        borderRightWidth: 1.2,
                        borderColor: theme.borderColor,
                      }}
                      className="px-1.5 py-2 items-end"
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: theme.badgePaidText,
                          fontVariant: ['tabular-nums'],
                        }}
                        className="text-[11px] md:text-xs font-black"
                      >
                        {model.tableFooterRow.col1 || '-'}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: isMobile ? 58 : 75,
                        borderRightWidth: 1.2,
                        borderColor: theme.borderColor,
                      }}
                      className="px-1.5 py-2 items-end"
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: theme.badgeUnpaidText,
                          fontVariant: ['tabular-nums'],
                        }}
                        className="text-[11px] md:text-xs font-black"
                      >
                        {model.tableFooterRow.col2 || '-'}
                      </Text>
                    </View>
                    <View
                      style={{ width: isMobile ? 72 : 85 }}
                      className="px-1.5 py-2 items-end"
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: theme.textColor,
                          fontVariant: ['tabular-nums'],
                        }}
                        className="text-[11px] md:text-xs font-black"
                      >
                        {model.tableFooterRow.col3 || '-'}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          )}

          {/* Stats Bar */}
          {model.stats && model.stats.length > 0 ? (
            <View className="flex-row gap-1.5 md:gap-2 mt-3">
              {model.stats.map((st, sIndex) => (
                <View
                  key={`stat-${sIndex}`}
                  style={{
                    backgroundColor: theme.numberBg,
                    borderWidth: 1.2,
                    borderColor: theme.borderColor,
                  }}
                  className="flex-1 p-1.5 md:p-2"
                >
                  <Text
                    numberOfLines={1}
                    style={{ color: theme.secondaryTextColor }}
                    className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider"
                  >
                    {st.label}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: st.color || theme.textColor,
                      fontVariant: ['tabular-nums'],
                    }}
                    className="text-[10px] md:text-xs font-black mt-0.5"
                  >
                    {st.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Footer Branding Note */}
          <View className="mt-3 items-center">
            <Text
              style={{ color: theme.secondaryTextColor }}
              className="text-[9px] md:text-[10px] italic text-center font-medium"
            >
              {model.footerNote ||
                'EC Treasury Management System • Confidential Class Report'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
