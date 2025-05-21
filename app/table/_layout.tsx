import { Stack } from 'expo-router';

export default function TableLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="collaborate" />
    </Stack>
  );
}