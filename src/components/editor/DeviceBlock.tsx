import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, GripVertical, Trash2 } from "lucide-react";
import { Handle, Position } from "reactflow";
import type { DiagramDevice, Device, DeviceIO } from "@/types";

export default function DeviceBlock({
  data,
}: {
  data: {
    diagramDevice: DiagramDevice;
    device: Device;
    deviceIOs: DeviceIO[];
    onSelect: (diagramDevice: DiagramDevice) => void;
    onDelete: () => void;
  };
}) {
  const { diagramDevice, device, deviceIOs, onSelect, onDelete } = data;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const inputs = deviceIOs.filter((io) => io.direction === "Input");
  const outputs = deviceIOs.filter((io) => io.direction === "Output");

  return (
    <Card
      className="bg-white shadow-xl transition-all w-64"
      onClick={() => onSelect(diagramDevice)}
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
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-gray-500 hover:text-red-500">
            <Trash2 className="w-5 h-5" />
          </Button>
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

      <div className="flex justify-between p-4 bg-gray-50 border-t">
        <div className="flex flex-col gap-2 items-start">
          {inputs.map((input, index) => (
            <div key={input.id} className="relative text-left">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{ top: `${(index + 1) * 20}px` }}
              />
              <span className="text-xs ml-2">{input.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 items-end">
          {outputs.map((output, index) => (
            <div key={output.id} className="relative text-right">
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{ top: `${(index + 1) * 20}px` }}
              />
              <span className="text-xs mr-2">{output.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
