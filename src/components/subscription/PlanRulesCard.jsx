import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Text from '../Text';
import colors from '../../constants/colors';

/**
 * Shows plan-specific like/messaging rules (bullet list).
 * @param {{ title: string, items: string[], compact?: boolean }} props
 */
const PlanRulesCard = ({ title, items, compact }) => {
  const navigation = useNavigation();
  if (!items?.length) return null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Subscription')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.upgradeLink}>Plans</Text>
        </TouchableOpacity>
      </View>
      {items.map((line, i) => (
        <View key={`${i}-${line.slice(0, 12)}`} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.line}>{line}</Text>
        </View>
      ))}
    </View>
  );
};

export default PlanRulesCard;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F4F6FA',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  cardCompact: {
    marginHorizontal: 12,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  upgradeLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bullet: {
    width: 14,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  line: {
    flex: 1,
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});
