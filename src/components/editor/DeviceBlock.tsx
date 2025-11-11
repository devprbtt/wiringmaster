import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, GripVertical } from "lucide-react";
import { Handle, Position } from "reactflow";
import type { DiagramDevice, Device } from "@/types";

export default function DeviceBlock({
  data,
}: {
  data: {
    diagramDevice: DiagramDevice;
    device: Device;
    onSelect: (diagramDevice: DiagramDevice) => void;
  };
}) {
  const { diagramDevice, device, onSelect } = data;

  return (
    <Card
      className="bg-white shadow-xl transition-all w-64"
      onClick={() => onSelect(diagramDevice)}
    >
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{device.model}</h3>
            <p className="text-sm text-gray-600">{device.brand}</p>
          </div>
          {device.image_url ? (
            <img
              src={device.image_url}
              alt={device.model}
              className="w-12 h-12 object-contain rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {device.category}
        </Badge>
      </div>
    </Card>
  );
}
