import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AuthError as SupabaseAuthError } from "@supabase/supabase-js";

interface AuthErrorProps {
  error: string | SupabaseAuthError;
  details?: string | null;
}

export const AuthError = ({ error, details }: AuthErrorProps) => {
  const getErrorMessage = (error: string | SupabaseAuthError) => {
    if (typeof error === 'string') return error;
    
    switch (error.message) {
      case 'Invalid login credentials':
        return "We couldn't find an account with those credentials. Please check your email and password and try again.";
      case 'Email not confirmed':
        return "You need to verify your email address before signing in. Please check your inbox for a verification email.";
      case 'Invalid grant':
        return "We couldn't sign you in with those credentials. Please check your email and password and try again.";
      case 'Email already registered':
        return "An account with this email already exists. Would you like to sign in instead?";
      case 'Password is too short':
        return "Please use a longer password (at least 6 characters) to keep your account secure.";
      case 'User already registered':
        return "Looks like you already have an account! Try signing in instead.";
      case 'Invalid email':
        return "Please enter a valid email address.";
      case 'Request failed':
        return "We're having trouble connecting to our servers. Please check your internet connection and try again.";
      default:
        return "Something went wrong. Please try again or contact support if the problem persists.";
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Oops! Something's not quite right</AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <p className="font-medium">{getErrorMessage(error)}</p>
          {details && (
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
              {details}
            </pre>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};