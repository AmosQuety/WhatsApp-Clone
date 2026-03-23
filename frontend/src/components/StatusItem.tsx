import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../screens/utils/theme';
import type { Status } from '../../screens/utils/types';
import { UserAvatar } from './UserAvatar';

interface StatusItemProps {
  status: Status;
  onPress: () => void;
}

export const StatusItem = ({ status, onPress }: StatusItemProps) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatarWrapper, !status.viewed && styles.unviewedBorder]}>
        <UserAvatar name={status.user.name} avatar={status.user.avatar} size={60} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {status.user.name}
        </Text>
        <Text style={styles.time}>{formatTime(status.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  avatarWrapper: {
    padding: 3,
    borderRadius: 1000,
  },
  unviewedBorder: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.fontSize.regular,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  time: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
  },
});
