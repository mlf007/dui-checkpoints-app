import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getLocationColor } from '../utils/colors';
import { formatDate, isToday, isUpcoming } from '../utils/dateUtils';
import type { Checkpoint } from '../types/checkpoint';
import { COLORS } from '../constants/config';

interface CheckpointListProps {
  checkpoints: Checkpoint[];
  selectedCheckpoint: Checkpoint | null;
  onSelectCheckpoint: (checkpoint: Checkpoint) => void;
  loading: boolean;
}

const CheckpointList: React.FC<CheckpointListProps> = ({
  checkpoints,
  selectedCheckpoint,
  onSelectCheckpoint,
  loading,
}) => {
  const renderItem = ({ item }: { item: Checkpoint }) => {
    const isSelected = selectedCheckpoint?.id === item.id;
    const color = getLocationColor(item.County);
    const today = isToday(item.Date);
    const upcoming = isUpcoming(item.Date);

    return (
      <TouchableOpacity
        style={[
          styles.item,
          isSelected && { backgroundColor: '#FFF5F0', borderLeftColor: color },
        ]}
        onPress={() => onSelectCheckpoint(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <Text style={styles.itemTitle}>{item.City || 'Unknown City'}</Text>
            <Text style={[styles.itemCounty, { color }]}>
              {item.County || ''}
            </Text>
          </View>
          {today ? (
            <View style={styles.badgeToday}>
              <Text style={styles.badgeTodayText}>TODAY</Text>
            </View>
          ) : upcoming ? (
            <View style={styles.badgeUpcoming}>
              <Text style={styles.badgeUpcomingText}>Upcoming</Text>
            </View>
          ) : (
            <View style={styles.badgePast}>
              <Text style={styles.badgePastText}>Past</Text>
            </View>
          )}
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemDate}>{formatDate(item.Date)}</Text>
          <Text style={styles.itemTime}>{item.Time || 'TBD'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading checkpoints...</Text>
      </View>
    );
  }

  if (checkpoints.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No checkpoints found</Text>
        <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={checkpoints}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      bounces={true}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 20,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemCounty: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  itemDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  badgeToday: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTodayText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeUpcoming: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeUpcomingText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '500',
  },
  badgePast: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePastText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default CheckpointList;

