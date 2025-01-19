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
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'Email not confirmed':
        return 'Please verify your email address before signing in.';
      default:
        return error.message;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertTitle>Authentication Error</AlertTitle>
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
      </div>
    </div>
  );
};