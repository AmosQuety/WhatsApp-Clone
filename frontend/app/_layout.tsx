import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { ChatProvider } from '../src/context/ChatContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChatProvider>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#0f172a',
                },
                headerTintColor: '#38bdf8',
                headerTitleStyle: {
                  fontWeight: '800',
                  fontSize: 22,
                },
                contentStyle: {
                  backgroundColor: '#0f172a',
                },
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  title: 'Prism',
                  headerShown: true,
                }}
              />
            </Stack>
          </ChatProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}