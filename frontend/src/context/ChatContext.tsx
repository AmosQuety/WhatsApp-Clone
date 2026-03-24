import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  collectionGroup 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import apiClient from '../utils/apiClient';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  visibleTo: string[];
  type: string;
  mediaUrl?: string | null;
}

interface Group {
  id: string;
  name: string;
  type: 'group' | 'direct';
  participantUids?: string[];
  lastMessage?: any;
}

interface ChatContextType {
  groups: Group[];
  messages: Message[];
  loadingGroups: boolean;
  loadingMessages: boolean;
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  sendMessage: (text: string, visibleTo?: string[], type?: 'text' | 'image', mediaUrl?: string | null) => Promise<void>;
  createGroup: (name: string) => Promise<string>;
  getGroupMembers: (groupId: string) => Promise<{uid: string, name: string}[]>;
  startDirectChat: (targetUid: string, targetName: string) => Promise<string>;
  searchUsers: (query: string) => Promise<{uid: string, name: string, email?: string}[]>;
}

const ChatContext = createContext<ChatContextType>({
  groups: [],
  messages: [],
  loadingGroups: true,
  loadingMessages: false,
  activeGroupId: null,
  setActiveGroupId: () => {},
  sendMessage: async () => {},
  createGroup: async () => '',
  getGroupMembers: async () => [],
  startDirectChat: async () => '',
  searchUsers: async () => [],
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // 1. Listen for Groups the user is a member of
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoadingGroups(false);
      return;
    }

    const q = query(
      collectionGroup(db, 'members'),
      where('uid', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, async (_) => {
      try {
        const response = await apiClient.get('/groups/my');
        setGroups(response.data);
      } catch (error) {
        console.error('Failed to fetch groups from backend:', error);
      }
      setLoadingGroups(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Listen for Messages in the active group
  useEffect(() => {
    if (!user || !activeGroupId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    const messagesRef = collection(db, 'groups', activeGroupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(msgs);
      setLoadingMessages(false);
    }, (error) => {
      console.error('Firestore subscription error:', error);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [user, activeGroupId]);

  const sendMessage = async (text: string, visibleTo: string[] = ['ALL'], type: string = 'text', mediaUrl: string | null = null) => {
    if (!user || !activeGroupId) return;
    await apiClient.post(`/groups/${activeGroupId}/messages`, {
      text,
      visibleTo,
      type,
      mediaUrl
    });
  };

  const createGroup = async (name: string) => {
    const response = await apiClient.post('/groups', { name });
    return response.data.id;
  };

  const getGroupMembers = async (groupId: string) => {
    try {
      const response = await apiClient.get(`/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch members:', error);
      return [];
    }
  };

  const startDirectChat = async (targetUid: string, targetName: string) => {
    const response = await apiClient.post('/chats/direct', { 
      recipientUid: targetUid, 
      recipientName: targetName 
    });
    return response.data.id;
  };

  const searchUsers = async (queryStr: string) => {
    try {
      const response = await apiClient.get('/users/search', {
        params: { query: queryStr }
      });
      return response.data;
    } catch (error) {
      console.log('Search failed:', error);
      return [];
    }
  };

  return (
    <ChatContext.Provider value={{
      groups,
      messages,
      loadingGroups,
      loadingMessages,
      activeGroupId,
      setActiveGroupId,
      sendMessage,
      createGroup,
      getGroupMembers,
      startDirectChat,
      searchUsers
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
