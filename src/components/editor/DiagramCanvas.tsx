import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionMode,
} from 'reactflow';
import type { Node } from 'reactflow';
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
  const queryClient = useQueryClient();
  const nodeTypes = useMemo(() => ({ device: DeviceBlock }), []);
  const [snapToGrid, setSnapToGrid] = useState(true);

  type UpdateDiagramDeviceVars = {
    id: string;
    position_x: number;
    position_y: number;
  };

  const updateDevicePositionMutation = useMutation<DiagramDevice, Error, UpdateDiagramDeviceVars>({
    mutationFn: (data: UpdateDiagramDeviceVars) => {
      const { id, ...payload } = data;
      return api.diagramDevices.update(id, payload) as Promise<DiagramDevice>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diagram-devices', data.diagram_id] });
    },
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes = diagramDevices.map((diagramDevice) => {
      const device = devices.find((d) => d.id === diagramDevice.device_id);
      return {
        id: diagramDevice.id,
        type: 'device',
        position: { x: diagramDevice.position_x, y: diagramDevice.position_y },
        data: { diagramDevice, device, onSelect: onSelectDevice },
      };
    });
    setNodes(newNodes);
  }, [diagramDevices, devices, onSelectDevice, setNodes]);

  useEffect(() => {
    // distribute parallel edges between the same pair over different handles
    const MAX_HANDLES = 5;
    const pairIndex: Record<string, number> = {};

    const keyFor = (a: string, b: string) => {
      // group by unordered pair so both directions spread similarly
      return [a, b].sort().join('|');
    };

    const newEdges = connections.map((connection) => {
      const key = keyFor(connection.source_diagram_device_id, connection.target_diagram_device_id);
      const idx = pairIndex[key] ?? 0;
      pairIndex[key] = idx + 1;
      const handleIdx = idx % MAX_HANDLES;

      return {
        id: connection.id,
        source: connection.source_diagram_device_id,
        target: connection.target_diagram_device_id,
        // attach to different handles to avoid overlapping
        sourceHandle: `s${handleIdx}`,
        targetHandle: `t${handleIdx}`,
        type: 'smoothstep' as const,
        animated: true,
        style: { stroke: getColorFromString(connection.id) },
        label: connection.cable_label,
        labelShowBg: true,
        labelBgStyle: { fill: 'white' },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
    });

    setEdges(newEdges);
  }, [connections, setEdges]);

  const deleteDeviceMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => api.diagramDevices.delete(id),
    onMutate: async (id: string) => {
      // optimistic removal from react-query caches for any diagram-devices queries
      await queryClient.cancelQueries({ queryKey: ['diagram-devices'] });
      queryClient.setQueriesData({ queryKey: ['diagram-devices'] }, (old: DiagramDevice[] | undefined) => {
        if (!old) return old;
        return old.filter((d) => d.id !== id);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-devices'] });
    },
  });

  const onNodesDelete = (deletedNodes: Node[]) => {
    for (const node of deletedNodes) {
      deleteDeviceMutation.mutate(node.id);
    }
  };

  const onNodeDragStop = (_: React.MouseEvent, node: Node) => {
    updateDevicePositionMutation.mutate({
      id: node.id,
      position_x: node.position.x,
      position_y: node.position.y,
    });
  };

  return (
    <div style={{ height: '100%', width: '100%' }} className="reactflow-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        fitView
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        // right-click (button 2) to pan, keep left-click free for UI
        panOnDrag={[2]}
        // enforce opposite-handle connections only
        connectionMode={ConnectionMode.Strict}
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap />
        <Controls />
        <Background />
        <div
          className="absolute bottom-4 left-4 flex items-center gap-2 bg-gray-800 p-2 rounded nopan nowheel"
          style={{ zIndex: 5 }}
        >
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
