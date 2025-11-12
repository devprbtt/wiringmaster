import { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DeviceLibraryPanel from "../components/editor/DeviceLibraryPanel";
import DiagramCanvas from "../components/editor/DiagramCanvas";
import ConnectionPanel from "../components/editor/ConnectionPanel";
import type { Diagram, DiagramDevice, Connection as ConnectionType, Device, DeviceIO } from "@/types";

export default function DiagramEditor() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const diagramId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [selectedDevice, setSelectedDevice] = useState<DiagramDevice | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedIO, setSelectedIO] = useState<DeviceIO | null>(null);

  const { data: diagram } = useQuery<Diagram | undefined>({
    queryKey: ['diagram', diagramId],
    queryFn: () => api.diagrams.get(diagramId!),
    enabled: !!diagramId,
  });

  const { data: diagramDevices = [] } = useQuery<DiagramDevice[]>({
    queryKey: ['diagram-devices', diagramId],
    queryFn: () => api.diagramDevices.list(diagramId!),
    enabled: !!diagramId,
  });

  const { data: connections = [] } = useQuery<ConnectionType[]>({
    queryKey: ['connections', diagramId],
    queryFn: () => api.connections.list(diagramId!),
    enabled: !!diagramId,
  });

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => api.devices.list(),
  });

  const { data: allIOs = [] } = useQuery<DeviceIO[]>({
    queryKey: ['all-ios'],
    queryFn: () => api.deviceIOs.list(),
  });

  type CreateDiagramDeviceVars = {
    diagram_id: string;
    device_id: string;
    position_x: number;
    position_y: number;
    rotation: number;
  };

  const addDeviceMutation = useMutation<DiagramDevice, Error, CreateDiagramDeviceVars>({
    mutationFn: (data: CreateDiagramDeviceVars) => api.diagramDevices.create(data) as Promise<DiagramDevice>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-devices', diagramId] });
      setShowLibrary(false);
    },
  });

  const handleAddDevice = (device: Device) => {
    if (!diagramId) return;
    addDeviceMutation.mutate({
      diagram_id: diagramId,
      device_id: device.id,
      position_x: 100,
      position_y: 100,
      rotation: 0
    });
  };

  const handleIOSelected = (io: DeviceIO) => {
    if (selectedIO && selectedIO.id === io.id) {
      setSelectedIO(null);
      return;
    }

    const connection = connections.find(c => c.source_io_id === io.id || c.target_io_id === io.id);
    if (connection) {
      const connectedIOId = connection.source_io_id === io.id ? connection.target_io_id : connection.source_io_id;
      const connectedIO = allIOs.find(i => i.id === connectedIOId);
      // @ts-ignore
      setSelectedIO({ ...io, connectedIO });
    } else {
      setSelectedIO(io);
    }
  };

  const exportToTable = () => {
    // Build cable list
    const cableList = connections.map((conn, index) => {
      const sourceDiagramDevice = diagramDevices.find(dd => dd.id === conn.source_diagram_device_id);
      const targetDiagramDevice = diagramDevices.find(dd => dd.id === conn.target_diagram_device_id);
      
      const sourceDevice = devices.find(d => d.id === sourceDiagramDevice?.device_id);
      const targetDevice = devices.find(d => d.id === targetDiagramDevice?.device_id);
      
      const sourceIO = allIOs.find(io => io.id === conn.source_io_id);
      const targetIO = allIOs.find(io => io.id === conn.target_io_id);
      
      // Extract cable type from notes
      let cableType = "Standard Cable";
      if (conn.notes && conn.notes.includes("Cable needed:")) {
        cableType = conn.notes.replace("Cable needed:", "").trim();
      }
      
      return {
        index: index + 1,
        cableLabel: conn.cable_label || `Cable ${index + 1}`,
        sourceDevice: `${sourceDevice?.brand} ${sourceDevice?.model}`,
        sourcePort: `${sourceIO?.label} (${sourceIO?.connector_type} ${sourceIO?.gender})`,
        targetDevice: `${targetDevice?.brand} ${targetDevice?.model}`,
        targetPort: `${targetIO?.label} (${targetIO?.connector_type} ${targetIO?.gender})`,
        cableType: cableType,
        cableLength: conn.cable_length || "TBD",
        notes: conn.notes || ""
      };
    });

    // Create CSV
    const headers = [
      "Cable #",
      "Cable Label",
      "From Device",
      "From Port",
      "To Device",
      "To Port",
      "Cable Type Needed",
      "Cable Length",
      "Notes"
    ];
    
    const csvContent = [
      headers.join(','),
      ...cableList.map(cable => [
        cable.index,
        `"${cable.cableLabel}"`,
        `"${cable.sourceDevice}"`,
        `"${cable.sourcePort}"`,
        `"${cable.targetDevice}"`,
        `"${cable.targetPort}"`,
        `"${cable.cableType}"`,
        `"${cable.cableLength}"`,
        `"${cable.notes}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${diagram?.name || 'diagram'}_cable_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!diagram) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading diagram...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(createPageUrl("Diagrams"))}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">{diagram.name}</h1>
            {diagram.client_name && (
              <p className="text-sm text-gray-400">{diagram.client_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToTable}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            disabled={connections.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Cable List
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              id="snap-to-grid"
              checked={snapToGrid}
              onCheckedChange={setSnapToGrid}
            />
            <Label htmlFor="snap-to-grid" className="text-white">Snap to Grid</Label>
          </div>
          <Button
            onClick={() => setShowLibrary(!showLibrary)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showLibrary && (
          <DeviceLibraryPanel
            onSelectDevice={handleAddDevice}
            onClose={() => setShowLibrary(false)}
          />
        )}

        <div className="flex-1 relative">
          <DiagramCanvas
            diagramDevices={diagramDevices}
            connections={connections}
            onSelectDevice={(d) => setSelectedDevice(d)}
            devices={devices}
            allIOs={allIOs}
            snapToGrid={snapToGrid}
            selectedIO={selectedIO}
            onIOSelected={handleIOSelected}
          />
        </div>

        {selectedDevice && (
          <ConnectionPanel
            diagramId={diagramId!}
            selectedDevice={selectedDevice}
            diagramDevices={diagramDevices}
            connections={connections}
            onClose={() => setSelectedDevice(null)}
          />
        )}
      </div>
    </div>
  );
}
