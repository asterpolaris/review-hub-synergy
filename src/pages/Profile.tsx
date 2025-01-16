import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileSettings } from "@/components/profile/ProfileSettings";

const Profile = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <h1 className="text-4xl font-semibold tracking-tight">Profile Settings</h1>
        <div className="max-w-2xl">
          <ProfileSettings />
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;