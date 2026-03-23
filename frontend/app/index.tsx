import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Call, Status } from '../screens/utils/types';
import { CallItem } from '../src/components/CallItem';
import { FAB } from '../src/components/FAB';
import { SearchBar } from '../src/components/SearchBar';
import { StatusItem } from '../src/components/StatusItem';
import { useAuth } from '../src/context/AuthContext';
import { Redirect } from 'expo-router';
import { Theme } from '../src/constants/Theme';
import Chats from '../screens/home/Chats';

type Tab = 'chats' | 'status' | 'calls';

// Mock data for Status and Calls (Phase 4/5)
const MOCK_CALLS: Call[] = [
  {
    id: '1',
    user: { id: '1', name: 'John Doe', avatar: undefined },
    type: 'voice',
    direction: 'outgoing',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'completed',
    duration: 245,
  },
  {
    id: '2',
    user: { id: '2', name: 'Jane Smith', avatar: undefined },
    type: 'video',
    direction: 'incoming',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'missed',
  },
];

const MOCK_STATUSES: Status[] = [
  {
    id: '1',
    user: { id: '1', name: 'My Status', avatar: undefined },
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    viewed: true,
  },
  {
    id: '2',
    user: { id: '2', name: 'Sarah Johnson', avatar: undefined },
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    viewed: false,
  },
];

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chats':
        return <Chats />;
      case 'status':
        return (
          <>
            <FlatList
              data={MOCK_STATUSES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <StatusItem status={item} onPress={() => console.log('Status pressed:', item.id)} />
              )}
              style={styles.list}
            />
            <FAB onPress={() => console.log('Add status')} icon="📷" />
          </>
        );
      case 'calls':
        return (
          <>
            <FlatList
              data={MOCK_CALLS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CallItem call={item} onPress={() => console.log('Call pressed:', item.id)} />
              )}
              style={styles.list}
            />
            <FAB onPress={() => console.log('New call')} icon="📞" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
            CHATS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'status' && styles.activeTab]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabText, activeTab === 'status' && styles.activeTabText]}>
            STATUS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calls' && styles.activeTab]}
          onPress={() => setActiveTab('calls')}
        >
          <Text style={[styles.tabText, activeTab === 'calls' && styles.activeTabText]}>
            CALLS
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search" />

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceDeep,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    color: Theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: Theme.colors.text.primary,
  },
  list: {
    flex: 1,
  },
});
