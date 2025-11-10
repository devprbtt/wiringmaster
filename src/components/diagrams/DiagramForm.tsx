import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Diagram } from "@/types";

export default function DiagramForm({ diagram, onClose }: { diagram?: Diagram | null; onClose: () => void }) {
  const [formData, setFormData] = useState<{ name: string; description: string; client_name: string }>(
    diagram
      ? {
          name: diagram.name || "",
          description: diagram.description || "",
          client_name: diagram.client_name || "",
        }
      : {
          name: "",
          description: "",
          client_name: "",
        }
  );
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (diagram) {
        return base44.entities.Diagram.update(diagram.id, data);
      }
      return base44.entities.Diagram.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={onClose} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Diagrams
        </Button>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {diagram ? 'Edit Diagram' : 'Create New Diagram'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Diagram Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Living Room A/V Setup"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Client/Project Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="e.g., Smith Residence"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this wiring diagram..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {saveMutation.isPending ? 'Saving...' : diagram ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
