import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface AuthErrorProps {
  error: string;
  details?: string | null;
}

export const AuthError = ({ error, details }: AuthErrorProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p className="font-medium">{error}</p>
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