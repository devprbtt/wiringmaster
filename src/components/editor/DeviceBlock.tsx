import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, GripVertical, Trash2 } from "lucide-react";
import { Handle, Position } from "reactflow";
import type { DiagramDevice, Device } from "@/types";

export default function DeviceBlock({
  data,
}: {
  data: {
    diagramDevice: DiagramDevice;
    device: Device;
    onSelect: (diagramDevice: DiagramDevice) => void;
    onDelete: () => void;
  };
}) {
  const { diagramDevice, device, onSelect, onDelete } = data;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card
      className="bg-white shadow-xl transition-all w-64"
      onClick={() => onSelect(diagramDevice)}
    >
      {/* multiple handles to allow parallel edges to route separately */}
      {/* source handles (outputs) along the top */}
      <Handle id="s0" type="source" position={Position.Top} style={{ left: '10%' }} />
      <Handle id="s1" type="source" position={Position.Top} style={{ left: '30%' }} />
      <Handle id="s2" type="source" position={Position.Top} style={{ left: '50%' }} />
      <Handle id="s3" type="source" position={Position.Top} style={{ left: '70%' }} />
      <Handle id="s4" type="source" position={Position.Top} style={{ left: '90%' }} />
      {/* target handles (inputs) along the bottom */}
      <Handle id="t0" type="target" position={Position.Bottom} style={{ left: '10%' }} />
      <Handle id="t1" type="target" position={Position.Bottom} style={{ left: '30%' }} />
      <Handle id="t2" type="target" position={Position.Bottom} style={{ left: '50%' }} />
      <Handle id="t3" type="target" position={Position.Bottom} style={{ left: '70%' }} />
      <Handle id="t4" type="target" position={Position.Bottom} style={{ left: '90%' }} />
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
    </Card>
  );
}
