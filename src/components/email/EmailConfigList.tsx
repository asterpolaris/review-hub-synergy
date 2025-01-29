import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { useEmailConfigurations } from "@/hooks/useEmailConfigurations";

interface EmailConfigListProps {
  businessId: string;
}

export const EmailConfigList = ({ businessId }: EmailConfigListProps) => {
  const {
    configurations,
    isLoading,
    toggleConfiguration,
    deleteConfiguration,
  } = useEmailConfigurations(businessId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email Address</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configurations?.map((config) => (
            <TableRow key={config.id}>
              <TableCell>{config.email_address}</TableCell>
              <TableCell className="capitalize">{config.type}</TableCell>
              <TableCell>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) =>
                    toggleConfiguration.mutate({
                      id: config.id,
                      isActive: checked,
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteConfiguration.mutate(config.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};