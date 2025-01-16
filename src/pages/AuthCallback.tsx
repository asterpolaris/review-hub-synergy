import { useEffect } from "react";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";
import { AuthError } from "@/components/auth/AuthError";

const AuthCallback = () => {
  const { error, details, handleCallback } = useOAuthCallback();

  useEffect(() => {
    handleCallback();
  }, []);

  if (error) {
    return <AuthError error={error} details={details} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Completing Authentication...</h1>
        <p className="mt-2 text-gray-600">Please wait while we process your login.</p>
      </div>
    </div>
  );
};

export default AuthCallback;