import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../screens/utils/theme';
import type { Call } from '../../screens/utils/types';
import { UserAvatar } from './UserAvatar';

interface CallItemProps {
  call: Call;
  onPress: () => void;
}

export const CallItem = ({ call, onPress }: CallItemProps) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getCallIcon = () => {
    const isMissed = call.status === 'missed';
    const color = isMissed ? '#FF0000' : theme.colors.primary;
    const icon = call.type === 'video' ? '📹' : '📞';
    const arrow = call.direction === 'incoming' ? '↙' : '↗';
    
    return { icon, arrow, color };
  };

  const { icon, arrow, color } = getCallIcon();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <UserAvatar name={call.user.name} avatar={call.user.avatar} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {call.user.name}
        </Text>
        <View style={styles.detailsRow}>
          <Text style={[styles.details, { color }]}>
            {arrow} {call.status === 'missed' ? 'Missed' : call.type}
          </Text>
          {call.duration && (
            <Text style={styles.duration}>
              {' '}
              · {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.time}>{formatTime(call.timestamp)}</Text>
        <Text style={styles.callTypeIcon}>{icon}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  name: {
    fontSize: theme.typography.fontSize.regular,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    fontSize: theme.typography.fontSize.small,
  },
  duration: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  callTypeIcon: {
    fontSize: 20,
  },
});
