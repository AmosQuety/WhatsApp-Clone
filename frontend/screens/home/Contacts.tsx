import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useChat } from '../../src/context/ChatContext';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export default function Contacts() {
  const { searchUsers, startDirectChat } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{uid: string, name: string, email?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const users = await searchUsers(text);
    setResults(users);
    setLoading(false);
  };

  const handleStartChat = async (user: {uid: string, name: string}) => {
    setStartingChat(user.uid);
    try {
      const chatId = await startDirectChat(user.uid, user.name);
      router.push(`/chat/${chatId}` as any);
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setStartingChat(null);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Theme.colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={Theme.colors.text.muted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.uid}
          ListHeaderComponent={
            query.length === 0 ? (
              <View>
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => {
                    // Navigate back to Chats and show modal
                    router.back();
                  }}
                >
                  <View style={[styles.avatar, { backgroundColor: Theme.colors.primary }]}>
                    <Ionicons name="people" size={24} color="#fff" />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: Theme.colors.primary }]}>New Group</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>CONTACTS ON PRISM</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleStartChat(item)}
              disabled={startingChat === item.uid}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
              </View>
              {startingChat === item.uid ? (
                <ActivityIndicator color={Theme.colors.primary} />
              ) : (
                <Ionicons name="chatbubble-outline" size={24} color={Theme.colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {query.length < 2 && query.length > 0 ? "Search for contacts to start a chat" : 
                 query.length >= 2 ? "No users found" : "Try searching for a user by email"}
              </Text>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: Theme.colors.text.primary,
    fontSize: 16,
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Theme.colors.surface,
  },
  sectionHeaderText: {
    color: Theme.colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  avatarText: {
    color: Theme.colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  contactName: {
    color: Theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  contactEmail: {
    color: Theme.colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: Theme.colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
