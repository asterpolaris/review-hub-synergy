import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmailRequests } from '@/hooks/useEmailRequests';
import type { EmailRequest, EmailRequestStatus } from '@/types/email';

interface EmailRequestListProps {
  businessId: string;
}

export function EmailRequestList({ businessId }: EmailRequestListProps) {
  const { emailRequests, isLoading, error, updateEmailStatus } = useEmailRequests(businessId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading email requests</div>;
  if (!emailRequests?.length) return <div>No email requests found</div>;

  const getStatusColor = (status: EmailRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleStatusChange = (requestId: string, newStatus: EmailRequestStatus) => {
    updateEmailStatus.mutate({ requestId, status: newStatus });
  };

  return (
    <div className="space-y-4">
      {emailRequests.map((request: EmailRequest) => (
        <Card key={request.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {request.subject}
            </CardTitle>
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium">From: {request.sender_name} ({request.sender_email})</p>
                <p className="text-sm text-gray-500 mt-1">{request.raw_content}</p>
              </div>
              <div className="flex justify-between items-center">
                <Select
                  value={request.status}
                  onValueChange={(value: EmailRequestStatus) => 
                    handleStatusChange(request.id, value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}