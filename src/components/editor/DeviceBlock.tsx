// No React default import needed with automatic JSX runtime
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, GripVertical } from "lucide-react";
import type { DiagramDevice, Device } from "@/types";

export default function DeviceBlock({
  diagramDevice,
  device,
  isSelected,
  onSelect,
  onDragStart
}: {
  diagramDevice: DiagramDevice;
  device: Device;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <Card
      id={`device-${diagramDevice.id}`}
      className={`absolute cursor-move bg-white shadow-xl transition-all ${
        isSelected ? 'ring-4 ring-cyan-500 shadow-2xl' : ''
      }`}
      style={{
        left: `${diagramDevice.position_x}px`,
        top: `${diagramDevice.position_y}px`,
        width: '300px',
        zIndex: isSelected ? 10 : 2
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
        onDragStart(e);
      }}
    >
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
              className="w-12 h-12 object-cover rounded"
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
