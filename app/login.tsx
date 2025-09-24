import { Redirect } from 'expo-router';

// This is a redirect file to ensure /login routes to /(auth)/login
export default function LoginRedirect() {
  return <Redirect href="/(auth)/login" />;
}