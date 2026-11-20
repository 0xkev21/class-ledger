import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { Event } from '@/src/types';
import { EventDetailContent } from './EventDetailContent';
import { DragDismissSheet } from './animated/DragDismissSheet';

interface EventDetailModalProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  visible,
  onClose,
  onShowToast,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const { isDark } = useAppTheme();

  if (!visible || !event) return null;

  return (
    <DragDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeight={windowHeight * 0.92}
      isDark={isDark}
      sheetClassName="p-0 overflow-hidden"
    >
      <EventDetailContent
        event={event}
        mode="sheet"
        onClose={onClose}
        onDeleted={onClose}
        onShowToast={onShowToast}
      />
    </DragDismissSheet>
  );
};
