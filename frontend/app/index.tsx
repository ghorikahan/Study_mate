import { Redirect } from 'expo-router';

// Root index redirects to the tab layout home screen
export default function Root() {
  return <Redirect href="/(tabs)" />;
}
