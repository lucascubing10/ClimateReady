import { Redirect } from 'expo-router';

// This is a redirect file to ensure /register routes to /auth/register
export default function RegisterRedirect() {
  return <Redirect href="/auth/register" />;
}