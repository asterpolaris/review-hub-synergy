interface BusinessCardProps {
  name: string;
  location: string;
  googleBusinessAccountId?: string | null;
}

export const BusinessCard = ({ name, location, googleBusinessAccountId }: BusinessCardProps) => {
  return (
    <div className="glass-panel rounded-lg p-6 space-y-2">
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="text-muted-foreground">{location}</p>
      {googleBusinessAccountId ? (
        <p className="text-sm text-green-600">Connected to Google</p>
      ) : (
        <p className="text-sm text-yellow-600">Not connected to Google</p>
      )}
    </div>
  );
};