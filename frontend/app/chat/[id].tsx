import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Switch,
  Modal,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChat } from '../../src/context/ChatContext';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/constants/Theme';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import axios from 'axios';
import { AUTH_HUB_CONFIG } from '../../src/config/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, loadingMessages, setActiveGroupId, sendMessage, groups, getGroupMembers } = useChat();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{uid: string, name: string}[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const group = groups.find(g => g.id === id);

  useEffect(() => {
    setActiveGroupId(id);
    loadMembers();
    return () => setActiveGroupId(null);
  }, [id]);

  const loadMembers = async () => {
    if (!id) return;
    const members = await getGroupMembers(id);
    setGroupMembers(members);
  };

  const handleGhostToggle = (value: boolean) => {
    setIsGhostMode(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (value) {
      setIsPickerVisible(true);
    } else {
      setSelectedRecipients([]);
    }
  };

  const toggleRecipient = (uid: string) => {
    setSelectedRecipients(prev => 
      prev.includes(uid) ? prev.filter(tid => tid !== uid) : [...prev, uid]
    );
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const visibleTo = isGhostMode 
      ? (selectedRecipients.length > 0 ? selectedRecipients : [user!.id]) 
      : ['ALL'];
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendMessage(inputText, visibleTo);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Allow Prism to access your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadMedia(result.assets[0].uri);
    }
  };

  const uploadMedia = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, filename);
      } else {
        // @ts-ignore
        formData.append('file', { uri, name: filename, type });
      }

      formData.append('groupId', id || '');

      const response = await axios.post(`${AUTH_HUB_CONFIG.WHATSAPP_BACKEND_URL}/media/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const visibleTo = isGhostMode 
        ? (selectedRecipients.length > 0 ? selectedRecipients : [user!.id]) 
        : ['ALL'];

      await sendMessage('', visibleTo, 'image', response.data.url);
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert("Upload Error", "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loadingMessages && messages.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group?.name || 'Chat'}</Text>
        <View style={styles.ghostStatus}>
          <Ionicons 
            name={isGhostMode ? "eye-off" : "eye"} 
            size={20} 
            color={isGhostMode ? Theme.colors.secondary : Theme.colors.text.muted} 
          />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id;
          const isSystem = item.type === 'system';
          const isImage = item.type === 'image';
          const isPrivate = !item.visibleTo.includes('ALL');

          if (isSystem) {
            return (
              <Animated.View 
                entering={FadeInDown.delay(100)}
                style={styles.systemMessage}
              >
                <Text style={styles.systemText}>{item.text}</Text>
              </Animated.View>
            );
          }

          return (
            <Animated.View 
              entering={FadeInDown.springify()}
              layout={Layout.springify()}
              style={[
                styles.messageBubble, 
                isMe ? styles.myMessage : styles.theirMessage,
                isImage && styles.imageMessage
              ]}
            >
              {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
              
              {isImage && item.mediaUrl ? (
                <Image 
                  source={{ uri: item.mediaUrl }} 
                  style={styles.messageImage} 
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Text style={styles.messageText}>{item.text}</Text>
              )}

              <View style={styles.messageFooter}>
                {isPrivate && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
                    <Ionicons name="eye-off" size={12} color={Theme.colors.secondary} style={{ marginRight: 2 }} />
                    {isMe && <Text style={{ color: Theme.colors.secondary, fontSize: 10, marginRight: 4 }}>Shared with {item.visibleTo.length}</Text>}
                  </View>
                )}
                <Text style={styles.messageTime}>
                  {new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </Animated.View>
          );
        }}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.ghostToggleContainer}>
          <Text style={[styles.ghostLabel, isGhostMode && styles.ghostLabelActive]}>
            {isGhostMode ? "Ghost Mode ON" : "Ghost Mode"}
          </Text>
          <Switch
            value={isGhostMode}
            onValueChange={handleGhostToggle}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.surface }}
            thumbColor={isGhostMode ? Theme.colors.secondary : Theme.colors.text.muted}
          />
        </View>
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.attachmentButton} 
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <Ionicons name="image" size={24} color={Theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Theme.colors.text.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim() || uploading}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ghost Mode: Select Recipients</Text>
              <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtite}>Who should see this message?</Text>
            
            <FlatList
              data={groupMembers.filter(m => m.uid !== user?.id)}
              keyExtractor={(m) => m.uid}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.memberItem} 
                  onPress={() => toggleRecipient(item.uid)}
                >
                  <Ionicons 
                    name={selectedRecipients.includes(item.uid) ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={Theme.colors.secondary} 
                  />
                  <Text style={styles.memberName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={() => setIsPickerVisible(false)}
            >
              <Text style={styles.confirmButtonText}>Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
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
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: Theme.colors.surfaceDeep,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 15,
    color: Theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  ghostStatus: {
    padding: 5,
  },
  messageList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  imageMessage: {
    padding: 4,
    width: 240,
  },
  messageImage: {
    width: '100%',
    height: 180,
    borderRadius: Theme.borderRadius.md,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Theme.colors.bubbles.my.bg,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.bubbles.their.bg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  senderName: {
    color: Theme.colors.text.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    color: Theme.colors.text.primary,
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    color: Theme.colors.text.muted,
    fontSize: 10,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  systemText: {
    color: Theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    padding: 12,
    backgroundColor: Theme.colors.surfaceDeep,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  ghostToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  ghostLabel: {
    color: Theme.colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  ghostLabelActive: {
    color: Theme.colors.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButton: {
    padding: 10,
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
    color: Theme.colors.text.primary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sendButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    color: Theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtite: {
    color: Theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: 15,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.border,
  },
  memberName: {
    color: Theme.colors.text.primary,
    fontSize: 16,
    marginLeft: 15,
  },
  confirmButton: {
    backgroundColor: Theme.colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    ...Theme.shadows.sm,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
