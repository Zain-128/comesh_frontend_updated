import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../Text';
import { getProfileInteractionHints } from '../../constants/subscriptionLikeMessagingRules';

const hintColors = {
  success: { bg: '#E8F5E9', text: '#2E7D32' },
  info: { bg: '#E3F2FD', text: '#1565C0' },
  elite: { bg: '#FFF3E0', text: '#E65100' },
  locked: { bg: '#FFEBEE', text: '#C62828' },
  muted: { bg: '#F5F5F5', text: '#616161' },
};

const ProfileMatchHints = ({ user, otherUserId }) => {
  const hints = getProfileInteractionHints(user, otherUserId);
  if (!hints.length) return null;

  return (
    <View style={styles.wrap}>
      {hints.map((h, i) => {
        const c = hintColors[h.type] || hintColors.muted;
        return (
          <View key={i} style={[styles.chip, { backgroundColor: c.bg }]}>
            <Text style={[styles.chipText, { color: c.text }]}>{h.text}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default ProfileMatchHints;

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
