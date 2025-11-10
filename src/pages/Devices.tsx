import { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DeviceForm from "../components/devices/DeviceForm";
import DeviceIOManager from "../components/devices/DeviceIOManager";
import type { Device } from "@/types";

export default function Devices() {
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [managingIODevice, setManagingIODevice] = useState<Device | null>(null);
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const allDevices = await api.devices.list();
      return allDevices.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    },
  });

  const deleteDeviceMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => api.devices.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setShowForm(true);
  };

  const handleManageIO = (device: Device) => {
    setManagingIODevice(device);
  };

  const categoryColors = {
    "Receiver": "bg-purple-100 text-purple-800",
    "HDMI Matrix": "bg-blue-100 text-blue-800",
    "Audio Extender": "bg-green-100 text-green-800",
    "Video Extender": "bg-cyan-100 text-cyan-800",
    "Savant Controller": "bg-indigo-100 text-indigo-800",
    "Amplifier": "bg-red-100 text-red-800",
    "Speaker": "bg-orange-100 text-orange-800",
    "Display": "bg-pink-100 text-pink-800",
    "Source Device": "bg-yellow-100 text-yellow-800",
    "Other": "bg-gray-100 text-gray-800",
  } as const;

  const getCategoryColor = (cat: string) => categoryColors[cat as keyof typeof categoryColors] ?? categoryColors["Other"];

  if (managingIODevice) {
    return (
      <DeviceIOManager
        device={managingIODevice}
        onClose={() => setManagingIODevice(null)}
      />
    );
  }

  if (showForm) {
    return (
      <DeviceForm
        device={editingDevice}
        onClose={() => {
          setShowForm(false);
          setEditingDevice(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Device Library</h1>
            <p className="text-gray-500 mt-1">Manage your A/V equipment catalog</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Device
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Card key={device.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              {device.image_url && (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={device.image_url}
                    alt={device.model}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              {!device.image_url && (
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{device.model}</CardTitle>
                    <p className="text-sm text-gray-600 font-medium">{device.brand}</p>
                  </div>
                  <Badge className={getCategoryColor(device.category)}>
                    {device.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {device.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{device.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageIO(device)}
                    className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  >
                    Manage I/O
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(device)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this device?')) {
                        deleteDeviceMutation.mutate(device.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {devices.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No devices yet</h3>
            <p className="text-gray-500 mb-6">Start building your equipment library</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Device
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
