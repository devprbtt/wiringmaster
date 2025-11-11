import { useMemo, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import DeviceBlock from './DeviceBlock';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getColorFromString } from "@/lib/colors";
import type { DiagramDevice, Device, Connection } from '@/types';

export default function DiagramCanvas({
  diagramDevices,
  connections,
  onSelectDevice,
  devices,
}: {
  diagramDevices: DiagramDevice[];
  connections: Connection[];
  onSelectDevice: (d: DiagramDevice | null) => void;
  devices: Device[];
}) {
  const nodeTypes = useMemo(() => ({ device: DeviceBlock }), []);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const nodes = useMemo(
    () =>
      diagramDevices.map((diagramDevice) => {
        const device = devices.find((d) => d.id === diagramDevice.device_id);
        return {
          id: diagramDevice.id,
          type: 'device',
          position: { x: diagramDevice.position_x, y: diagramDevice.position_y },
          data: { diagramDevice, device, onSelect: onSelectDevice },
        };
      }),
    [diagramDevices, devices, onSelectDevice]
  );

  const edges = useMemo(
    () =>
      connections.map((connection) => ({
        id: connection.id,
        source: connection.source_diagram_device_id,
        target: connection.target_diagram_device_id,
        animated: true,
        style: { stroke: getColorFromString(connection.id) },
      })),
    [connections]
  );

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
      >
        <MiniMap />
        <Controls />
        <Background />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-gray-800 p-2 rounded">
          <Switch
            id="snap-to-grid"
            checked={snapToGrid}
            onCheckedChange={setSnapToGrid}
          />
          <Label htmlFor="snap-to-grid" className="text-white">Snap to Grid</Label>
        </div>
      </ReactFlow>
    </div>
  );
}
