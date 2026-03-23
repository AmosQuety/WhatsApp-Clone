import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { useChat } from '../../src/context/ChatContext';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export default function Chats() {
  const { groups, loadingGroups, createGroup } = useChat();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      const groupId = await createGroup(newGroupName);
      setIsModalVisible(false);
      setNewGroupName('');
      router.push(`/chat/${groupId}` as any);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loadingGroups) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isDirect = item.type === 'direct';
          let displayName = item.name;
          
          if (isDirect && item.participantUids) {
            // In a real app, we'd fetch the other participant's name
            // For now, the group name is already "Chat with [Name]"
            // But we can strip the prefix if we want a cleaner look
            displayName = item.name.replace('Chat with ', '');
          }

          return (
            <TouchableOpacity 
              style={styles.groupItem}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
                {isDirect && <View style={styles.directBadge} />}
              </View>
              <View style={styles.content}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage?.text || (isDirect ? 'Start a conversation' : 'No messages yet')}
                </Text>
              </View>
              <Text style={styles.time}>
                {item.lastMessage?.createdAt ? new Date(item.lastMessage.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No chats found. Create or join a group to start messaging!</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/contacts')}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              placeholderTextColor={Theme.colors.text.muted}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.createButton]} 
                onPress={handleCreateGroup}
                disabled={isCreating || !newGroupName.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  groupItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  avatarText: {
    color: Theme.colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  directBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.colors.status.online,
    borderWidth: 2,
    borderColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  name: {
    color: Theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  lastMessage: {
    color: Theme.colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  time: {
    color: Theme.colors.text.muted,
    fontSize: 12,
  },
  emptyText: {
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceDeep,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalTitle: {
    color: Theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.lg,
  },
  input: {
    backgroundColor: Theme.colors.background,
    color: Theme.colors.text.primary,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    marginLeft: Theme.spacing.md,
  },
  cancelButton: {
    backgroundColor: Theme.colors.border,
  },
  createButton: {
    backgroundColor: Theme.colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
