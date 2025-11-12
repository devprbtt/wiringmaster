import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, GripVertical, Trash2 } from "lucide-react";
import { Handle, Position } from "reactflow";
import type { DiagramDevice, Device, DeviceIO } from "@/types";
import { cn } from "@/lib/utils";

export default function DeviceBlock({
  data,
}: {
  data: {
    diagramDevice: DiagramDevice;
    device: Device;
    deviceIOs: DeviceIO[];
    onSelect: (diagramDevice: DiagramDevice) => void;
    onDelete: () => void;
    selectedIO: DeviceIO | null;
    onIOSelected: (io: DeviceIO) => void;
  };
}) {
  const { diagramDevice, device, deviceIOs, onSelect, onDelete, selectedIO, onIOSelected } = data;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const inputs = deviceIOs.filter((io) => io.direction === "Input");
  const outputs = deviceIOs.filter((io) => io.direction === "Output");

  const isHighlighted = (io: DeviceIO) => {
    if (!selectedIO) return false;
    // @ts-ignore
    if (selectedIO.connectedIO && selectedIO.connectedIO.id === io.id) return true;
    return selectedIO.id === io.id;
  };

  return (
    <Card
      className="bg-white shadow-xl transition-all min-w-64"
      onClick={() => onSelect(diagramDevice)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg">{device.model}</h3>
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
        <div className="flex flex-col gap-y-2">
          {inputs.map((input) => (
            <div
              key={input.id}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                isHighlighted(input) && "text-blue-500 font-bold"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onIOSelected(input);
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                className="!relative !transform-none !left-0 !top-0"
              />
              <span className="text-xs">{input.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-y-2">
          {outputs.map((output) => (
            <div
              key={output.id}
              className={cn(
                "flex items-center gap-2 flex-row-reverse cursor-pointer",
                isHighlighted(output) && "text-blue-500 font-bold"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onIOSelected(output);
              }}
            >
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                className="!relative !transform-none !right-0 !top-0"
              />
              <span className="text-xs">{output.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
