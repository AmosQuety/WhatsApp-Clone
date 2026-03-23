import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../screens/utils/theme';
import type { Message } from '../../screens/utils/types';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

export const MessageBubble = ({ message, isSent }: MessageBubbleProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isSent ? styles.sentContainer : styles.receivedContainer]}>
      <View style={[styles.bubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
        <Text style={styles.content}>{message.content}</Text>
        <View style={styles.footer}>
          <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
          {isSent && (
            <Text style={styles.status}>
              {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : '✓✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    maxWidth: '80%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 8,
    padding: theme.spacing.sm,
  },
  sentBubble: {
    backgroundColor: theme.colors.bubbleSent,
    borderBottomRightRadius: 2,
  },
  receivedBubble: {
    backgroundColor: theme.colors.bubbleReceived,
    borderBottomLeftRadius: 2,
  },
  content: {
    fontSize: theme.typography.fontSize.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  time: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  status: {
    fontSize: 11,
    color: theme.colors.primary,
  },
});
