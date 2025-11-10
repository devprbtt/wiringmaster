import { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DeviceBlock from "./DeviceBlock";
import type { DiagramDevice, Device, DeviceIO, Connection } from "@/types";

export default function DiagramCanvas({
  diagramId,
  diagramDevices,
  connections,
  selectedDevice,
  onSelectDevice
}: {
  diagramId: string;
  diagramDevices: DiagramDevice[];
  connections: Connection[];
  selectedDevice: DiagramDevice | null;
  onSelectDevice: (d: DiagramDevice | null) => void;
}) {
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
  } | null>(null);

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => api.devices.list(),
  });

  const { data: allIOs = [] } = useQuery<DeviceIO[]>({
    queryKey: ['all-ios'],
    queryFn: () => api.deviceIOs.list(),
  });

  const updatePositionMutation = useMutation({
    mutationFn: ({ id, position_x, position_y }: { id: string; position_x: number; position_y: number }) =>
      api.diagramDevices.update(id, { position_x, position_y }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-devices', diagramId] });
    },
  });

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, diagramDevice: DiagramDevice) => {
    setDragging({
      id: diagramDevice.id,
      startX: e.clientX - diagramDevice.position_x,
      startY: e.clientY - diagramDevice.position_y
    });
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || e.clientX === 0) return;
    
    const newX = e.clientX - dragging.startX;
    const newY = e.clientY - dragging.startY;
    
    const element = document.getElementById(`device-${dragging.id}`);
    if (element) {
      element.style.left = `${newX}px`;
      element.style.top = `${newY}px`;
    }
  };

  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    
    const newX = Math.max(0, e.clientX - dragging.startX);
    const newY = Math.max(0, e.clientY - dragging.startY);
    
    updatePositionMutation.mutate({
      id: dragging.id,
      position_x: newX,
      position_y: newY
    });
    
    setDragging(null);
  };

  const getDeviceForDiagramDevice = (diagramDevice: DiagramDevice) => {
    return devices.find(d => d.id === diagramDevice.device_id);
  };

  // Calculate connection line path with offset to prevent overlap
  const getConnectionPath = (sourceDev, targetDev, connectionIndex, totalConnectionsBetween) => {
    const sourceX = sourceDev.position_x + 150;
    const sourceY = sourceDev.position_y + 50;
    const targetX = targetDev.position_x + 150;
    const targetY = targetDev.position_y + 50;
    
    // Calculate offset based on connection index
    const offsetMultiplier = totalConnectionsBetween > 1 ? (connectionIndex - (totalConnectionsBetween - 1) / 2) : 0;
    const offset = offsetMultiplier * 20;
    
    // Calculate control points for curved line
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate perpendicular offset for curve
    const perpX = -dy / distance * offset;
    const perpY = dx / distance * offset;
    
    const midX = (sourceX + targetX) / 2 + perpX;
    const midY = (sourceY + targetY) / 2 + perpY;
    
    return `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
  };

  // Group connections between same devices
  const connectionGroups = {};
  connections.forEach((conn) => {
    const key = [conn.source_diagram_device_id, conn.target_diagram_device_id].sort().join('-');
    if (!connectionGroups[key]) {
      connectionGroups[key] = [];
    }
    connectionGroups[key].push(conn);
  });

  return (
    <div
      className="w-full h-full bg-gray-900 relative overflow-hidden"
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      style={{ cursor: dragging ? 'grabbing' : 'default' }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
        {Object.entries(connectionGroups).map(([key, conns]) => {
          return conns.map((conn, index) => {
            const sourceDev = diagramDevices.find(d => d.id === conn.source_diagram_device_id);
            const targetDev = diagramDevices.find(d => d.id === conn.target_diagram_device_id);
            
            if (!sourceDev || !targetDev) return null;
            
            const path = getConnectionPath(sourceDev, targetDev, index, conns.length);
            
            // Get IO information for tooltip
            const sourceIO = allIOs.find(io => io.id === conn.source_io_id);
            const targetIO = allIOs.find(io => io.id === conn.target_io_id);
            
            return (
              <g key={conn.id}>
                <path
                  d={path}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="hover:stroke-cyan-400 transition-colors"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' }}
                >
                  <title>
                    {sourceIO?.label || 'Unknown'} → {targetIO?.label || 'Unknown'}
                    {conn.cable_label && ` (${conn.cable_label})`}
                    {conn.notes && `\n${conn.notes}`}
                  </title>
                </path>
                {conn.cable_label && (
                  <text
                    x={(sourceDev.position_x + targetDev.position_x) / 2 + 150}
                    y={(sourceDev.position_y + targetDev.position_y) / 2 + 50}
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                    style={{
                      textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)',
                      paintOrder: 'stroke fill'
                    }}
                  >
                    {conn.cable_label}
                  </text>
                )}
              </g>
            );
          });
        })}
      </svg>

      {/* Devices */}
      {diagramDevices.map((diagramDevice) => {
        const device = getDeviceForDiagramDevice(diagramDevice);
        if (!device) return null;

        return (
          <DeviceBlock
            key={diagramDevice.id}
            diagramDevice={diagramDevice}
            device={device}
            isSelected={selectedDevice?.id === diagramDevice.id}
            onSelect={() => onSelectDevice(diagramDevice)}
            onDragStart={(e) => handleDragStart(e, diagramDevice)}
          />
        );
      })}

      {diagramDevices.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">Canvas is empty</p>
            <p className="text-sm">Click "Add Device" to start building your diagram</p>
          </div>
        </div>
      )}
    </div>
  );
}
