import { useState } from "react";
import type { ReactNode } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import type { Device, DeviceIO } from "@/types";

const connectorTypes = [
  "HDMI", "RJ45", "RCA Audio", "XLR", "Optical Toslink", "Coaxial Digital",
  "DB9", "DB15", "USB-A", "USB-B", "USB-C", "3.5mm Jack", "1/4 Inch Jack",
  "Speaker Wire", "BNC", "Component Video", "Composite Video", "S-Video",
  "DisplayPort", "DVI", "CAT6", "Fiber Optic", "Dante", "Other"
];

const signalTypes = ["Video", "Audio", "Data", "Control", "Power", "Mixed"];

type Props = { device: Device; onClose: () => void };

export default function DeviceIOManager({ device, onClose }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingIO, setEditingIO] = useState<DeviceIO | null>(null);
  const [formData, setFormData] = useState<{ label: string; connector_type: string; gender: string; direction: string; signal_type: string }>({
    label: "",
    connector_type: "",
    gender: "Female",
    direction: "Input",
    signal_type: ""
  });
  const queryClient = useQueryClient();

  const iosQuery = useQuery<DeviceIO[]>({
    queryKey: ['device-ios', device.id],
    queryFn: () => base44.entities.DeviceIO.filter({ device_id: device.id }) as Promise<DeviceIO[]>,
  });
  const ios: DeviceIO[] = iosQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingIO) {
        return base44.entities.DeviceIO.update(editingIO.id, data);
      }
      return base44.entities.DeviceIO.create({ ...data, device_id: device.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-ios', device.id] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.DeviceIO.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-ios', device.id] });
    },
  });

  const resetForm = () => {
    setFormData({
      label: "",
      connector_type: "",
      gender: "Female",
      direction: "Input",
      signal_type: ""
    });
    setEditingIO(null);
    setShowForm(false);
  };

  const handleEdit = (io: DeviceIO) => {
    setEditingIO(io);
    setFormData({
      label: io.label,
      connector_type: io.connector_type,
      gender: io.gender,
      direction: io.direction,
      signal_type: io.signal_type
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const directionIcons: Record<'Input' | 'Output' | 'Bidirectional', ReactNode> = {
    Input: <ArrowDown className="w-4 h-4" />,
    Output: <ArrowUp className="w-4 h-4" />,
    Bidirectional: <ArrowLeftRight className="w-4 h-4" />
  };

  const signalColors: Record<string, string> = {
    Video: "bg-purple-100 text-purple-800",
    Audio: "bg-green-100 text-green-800",
    Data: "bg-blue-100 text-blue-800",
    Control: "bg-orange-100 text-orange-800",
    Power: "bg-red-100 text-red-800",
    Mixed: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="outline" onClick={onClose} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Devices
        </Button>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">
                {device.brand} {device.model}
              </CardTitle>
              <p className="text-sm text-gray-500">I/O Ports Configuration</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {ios.map((io) => (
                  <div
                    key={io.id}
                    className="p-4 border rounded-lg hover:border-blue-400 transition-colors bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {directionIcons[io.direction]}
                          <h4 className="font-semibold">{io.label}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {io.connector_type} {io.gender}
                          </Badge>
                          <Badge className={signalColors[io.signal_type]}>
                            {io.signal_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {io.direction}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(io)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this I/O port?')) {
                              deleteMutation.mutate(io.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {ios.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No I/O ports configured yet</p>
                    <p className="text-sm mt-1">Add ports to define device connections</p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add I/O Port
              </Button>
            </CardContent>
          </Card>

          {showForm && (
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>{editingIO ? 'Edit' : 'Add'} I/O Port</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Port Label *</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g., HDMI 1, Audio Out L"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connector_type">Connector Type *</Label>
                    <Select
                      value={formData.connector_type}
                      onValueChange={(value) => setFormData({ ...formData, connector_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectorTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direction">Direction *</Label>
                    <Select
                      value={formData.direction}
                      onValueChange={(value) => setFormData({ ...formData, direction: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Input">Input</SelectItem>
                        <SelectItem value="Output">Output</SelectItem>
                        <SelectItem value="Bidirectional">Bidirectional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signal_type">Signal Type *</Label>
                    <Select
                      value={formData.signal_type}
                      onValueChange={(value) => setFormData({ ...formData, signal_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select signal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {signalTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {saveMutation.isPending ? 'Saving...' : editingIO ? 'Update' : 'Add Port'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
