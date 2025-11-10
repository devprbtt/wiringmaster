import { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);

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

  const addDeviceMutation = useMutation({
    mutationFn: (data) => api.diagramDevices.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-devices', diagramId] });
      setShowLibrary(false);
    },
  });

  const handleAddDevice = (device) => {
    addDeviceMutation.mutate({
      diagram_id: diagramId,
      device_id: device.id,
      position_x: 100,
      position_y: 100,
      rotation: 0
    });
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
            diagramId={diagramId}
            diagramDevices={diagramDevices}
            connections={connections}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
          />
        </div>

        {selectedDevice && (
          <ConnectionPanel
            diagramId={diagramId}
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
