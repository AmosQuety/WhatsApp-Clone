export interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Call {
  id: string;
  user: User;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing';
  timestamp: Date;
  duration?: number;
  status: 'missed' | 'completed' | 'declined';
}

export interface Status {
  id: string;
  user: User;
  timestamp: Date;
  viewed: boolean;
  mediaUrl?: string;
}