import { useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Device } from "@/types";

export default function DeviceLibraryPanel({ onSelectDevice, onClose }: { onSelectDevice: (d: Device) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const allDevices = await api.devices.list();
      return allDevices.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    },
  });

  const filteredDevices = devices.filter(device =>
    device.model.toLowerCase().includes(search.toLowerCase()) ||
    device.brand.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Device Library</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="pl-10 bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredDevices.map((device) => (
          <Card
            key={device.id}
            className="cursor-pointer hover:bg-gray-700 transition-colors bg-gray-750 border-gray-600"
            onClick={() => onSelectDevice(device)}
          >
            <CardContent className="p-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                  {device.image_url ? (
                    <img
                      src={device.image_url}
                      alt={device.model}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-white truncate">{device.model}</h3>
                  <p className="text-xs text-gray-400 truncate">{device.brand}</p>
                  <Badge className={`${getCategoryColor(device.category)} text-xs mt-1`}>
                    {device.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
