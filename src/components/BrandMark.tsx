import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export interface BrandMarkProps {
  size?: number;
  accentColor?: string;
}

/**
 * Class Ledger open-book mark matching public/landing/favicon.svg.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 26,
  accentColor = '#0d7480',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect width="32" height="32" rx="8" fill="#1f3038" />
      <Path
        d="M7.5 9.5C7.5 8.67 8.17 8 9 8H15.5V23.5H9C8.17 23.5 7.5 22.83 7.5 22V9.5Z"
        fill="#f7f9fa"
      />
      <Path
        d="M16.5 8H23C23.83 8 24.5 8.67 24.5 9.5V22C24.5 22.83 23.83 23.5 23 23.5H16.5V8Z"
        fill="#ecf0f2"
      />
      <Rect x="19" y="8" width="2.5" height="6.5" rx="0.6" fill={accentColor} />
      <Path
        d="M9.5 12H13.5M9.5 15.5H13.5M9.5 19H12.5"
        stroke="#1f3038"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M18.5 17H22.5M18.5 20H21.5"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};
