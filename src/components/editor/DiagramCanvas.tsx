import React, { useMemo, useEffect } from 'react';
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
import { getColorFromString } from "@/lib/colors";
import type { DiagramDevice, Device, Connection, DeviceIO } from '@/types';

export default function DiagramCanvas({
  diagramDevices,
  connections,
  onSelectDevice,
  devices,
  allIOs,
  snapToGrid,
  selectedIO,
  onIOSelected,
  onCreateConnection,
}: {
  diagramDevices: DiagramDevice[];
  connections: Connection[];
  onSelectDevice: (d: DiagramDevice | null) => void;
  devices: Device[];
  allIOs: DeviceIO[];
  snapToGrid: boolean;
  selectedIO: DeviceIO | null;
  onIOSelected: (io: DeviceIO) => void;
  onCreateConnection: (params: any) => void;
}) {
  const queryClient = useQueryClient();
  const nodeTypes = useMemo(() => ({ device: DeviceBlock }), []);

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

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes = diagramDevices.map((diagramDevice) => {
      const device = devices.find((d) => d.id === diagramDevice.device_id);
      const deviceIOs = allIOs.filter((io) => io.device_id === device?.id);
      return {
        id: diagramDevice.id,
        type: 'device',
        position: { x: diagramDevice.position_x, y: diagramDevice.position_y },
        data: {
          diagramDevice,
          device,
          deviceIOs,
          onSelect: onSelectDevice,
          onDelete: () => deleteDeviceMutation.mutate(diagramDevice.id),
          selectedIO,
          onIOSelected,
        },
      };
    });
    setNodes(newNodes);
  }, [diagramDevices, devices, allIOs, onSelectDevice, selectedIO, onIOSelected]);

  useEffect(() => {
    // distribute parallel edges between the same pair over different handles
    const MAX_HANDLES = 5;
    const pairIndex: Record<string, number> = {};

    const keyFor = (a: string, b: string) => {
      // group by unordered pair so both directions spread similarly
      return [a, b].sort().join('|');
    };

    const newEdges = connections.map((connection) => {
      return {
        id: connection.id,
        source: connection.source_diagram_device_id,
        target: connection.target_diagram_device_id,
        sourceHandle: connection.source_io_id,
        targetHandle: connection.target_io_id,
        type: 'smoothstep' as const,
        animated: true,
        style: { stroke: getColorFromString(connection.id), strokeWidth: 3 },
        label: connection.cable_label,
        labelShowBg: true,
        labelBgStyle: { fill: 'white' },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      };
    });

    setEdges(newEdges);
  }, [connections, setEdges]);

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
        onConnect={onCreateConnection}
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
      </ReactFlow>
    </div>
  );
}
