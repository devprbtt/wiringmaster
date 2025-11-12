import { useState, useMemo } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, AlertCircle, ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DiagramDevice, Device, DeviceIO, Connection, CreateConnectionPayload } from "@/types";

// Define connection compatibility rules
const connectionRules: Record<string, { compatible: string[] }> = {
  "HDMI": { compatible: ["HDMI"] },
  "RJ45": { compatible: ["RJ45", "CAT6"] },
  "CAT6": { compatible: ["RJ45", "CAT6"] },
  "RCA Audio": { compatible: ["RCA Audio"] },
  "XLR": { compatible: ["XLR"] },
  "Optical Toslink": { compatible: ["Optical Toslink"] },
  "Coaxial Digital": { compatible: ["Coaxial Digital"] },
  "DB9": { compatible: ["DB9"] },
  "DB15": { compatible: ["DB15"] },
  "USB-A": { compatible: ["USB-A"] },
  "USB-B": { compatible: ["USB-B"] },
  "USB-C": { compatible: ["USB-C"] },
  "3.5mm Jack": { compatible: ["3.5mm Jack"] },
  "1/4 Inch Jack": { compatible: ["1/4 Inch Jack"] },
  "Speaker Wire": { compatible: ["Speaker Wire"] },
  "BNC": { compatible: ["BNC"] },
  "Component Video": { compatible: ["Component Video"] },
  "Composite Video": { compatible: ["Composite Video"] },
  "S-Video": { compatible: ["S-Video"] },
  "DisplayPort": { compatible: ["DisplayPort"] },
  "DVI": { compatible: ["DVI"] },
  "Fiber Optic": { compatible: ["Fiber Optic"] },
  "Dante": { compatible: ["Dante"] },
  "Other": { compatible: ["Other"] }
};

function getCableType(sourceIO: import("@/types").DeviceIO, targetIO: import("@/types").DeviceIO) {
  const connectorType = sourceIO.connector_type;
  
  // Determine cable gender configuration based on port genders
  const sourceGender = sourceIO.gender;
  const targetGender = targetIO.gender;
  
  let cableConfig = "";
  
  if (sourceGender === "Female" && targetGender === "Female") {
    cableConfig = "Male-Male";
  } else if (sourceGender === "Male" && targetGender === "Male") {
    cableConfig = "Female-Female";
  } else if (sourceGender === "Male" && targetGender === "Female") {
    cableConfig = "Male-Female";
  } else if (sourceGender === "Female" && targetGender === "Male") {
    cableConfig = "Female-Male";
  } else if (sourceGender === "N/A" || targetGender === "N/A") {
    cableConfig = "Standard";
  }
  
  return `${connectorType} ${cableConfig} Cable`;
}

function checkCompatibility(sourceIO: import("@/types").DeviceIO, targetIO: import("@/types").DeviceIO) {
  // Check connector type compatibility
  const rule = connectionRules[sourceIO.connector_type];
  if (!rule) return { compatible: false, message: "Unknown connector type" };

  if (!rule.compatible.includes(targetIO.connector_type)) {
    return {
      compatible: false,
      message: `${sourceIO.connector_type} cannot connect to ${targetIO.connector_type}. Connector types must match.`
    };
  }

  // Check direction compatibility - this is the key change
  const sourceDir = sourceIO.direction;
  const targetDir = targetIO.direction;
  
  // Valid connections:
  // Output -> Input
  // Input -> Output
  
  const isValidDirection = (sourceDir === "Output" && targetDir === "Input") || (sourceDir === "Input" && targetDir === "Output");
  
  if (!isValidDirection) {
    return {
      compatible: false,
      message: `Direction mismatch: Cannot connect ${sourceDir} to ${targetDir}. You can only connect Output to Input, or use Bidirectional ports.`
    };
  }

  const cableType = getCableType(sourceIO, targetIO);
  return { compatible: true, message: "Compatible connection", cableType };
}

export default function ConnectionPanel({
  diagramId,
  selectedDevice,
  diagramDevices,
  connections,
  onClose
}: { diagramId: string; selectedDevice: DiagramDevice; diagramDevices: DiagramDevice[]; connections: Connection[]; onClose: () => void }) {
  const [sourceIOId, setSourceIOId] = useState<string>("");
  const [targetDeviceId, setTargetDeviceId] = useState<string>("");
  const [targetIOId, setTargetIOId] = useState<string>("");
  const [cableLabel, setCableLabel] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: device } = useQuery<Device | undefined>({
    queryKey: ['device', selectedDevice.device_id],
    queryFn: () => api.devices.get(selectedDevice.device_id),
  });

  const { data: deviceIOs = [] } = useQuery<DeviceIO[]>({
    queryKey: ['device-ios', selectedDevice.device_id],
    queryFn: () => api.deviceIOs.list(selectedDevice.device_id) as Promise<DeviceIO[]>,
  });

  const { data: targetIOs = [] } = useQuery<DeviceIO[]>({
    queryKey: ['target-ios', targetDeviceId],
    queryFn: () => {
      if (!targetDeviceId) return Promise.resolve([]);
      const targetDiagramDevice = diagramDevices.find(d => d.id === targetDeviceId);
      if (!targetDiagramDevice) return Promise.resolve([]);
      return api.deviceIOs.list(targetDiagramDevice.device_id) as Promise<DeviceIO[]>;
    },
    enabled: !!targetDeviceId,
  });

  const { data: allDevices = [] } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => api.devices.list() as Promise<Device[]>,
  });

  const { data: allIOs = [] } = useQuery<DeviceIO[]>({
    queryKey: ['all-ios'],
    queryFn: () => api.deviceIOs.list() as Promise<DeviceIO[]>,
  });

  const createConnectionMutation = useMutation({
    mutationFn: (data: CreateConnectionPayload) => api.connections.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', diagramId] });
      resetForm();
    },
  });

  const deleteConnectionMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => api.connections.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', diagramId] });
    },
  });

  const resetForm = () => {
    setSourceIOId("");
    setTargetDeviceId("");
    setTargetIOId("");
    setCableLabel("");
  };

  const occupiedIOs = useMemo(() => {
    const occupiedIds = new Set<string>();
    connections.forEach(conn => {
      occupiedIds.add(conn.source_io_id);
      occupiedIds.add(conn.target_io_id);
    });
    return occupiedIds;
  }, [connections]);

  const compatibility = useMemo(() => {
    if (!sourceIOId || !targetIOId) return null;

    const sourceIO = deviceIOs.find(io => io.id === sourceIOId);
    const targetIO = targetIOs.find(io => io.id === targetIOId);
    
    if (sourceIO && targetIO) {
      return checkCompatibility(sourceIO, targetIO);
    }
    return null;
  }, [sourceIOId, targetIOId, deviceIOs, targetIOs]);

  const handleCreateConnection = () => {
    if (!compatibility || !compatibility.compatible) return;

    createConnectionMutation.mutate({
      diagram_id: diagramId,
      source_diagram_device_id: selectedDevice.id,
      source_io_id: sourceIOId,
      target_diagram_device_id: targetDeviceId,
      target_io_id: targetIOId,
      cable_label: cableLabel,
      notes: `Cable needed: ${compatibility.cableType}`
    });
  };

  const deviceConnections = connections.filter(
    c => c.source_diagram_device_id === selectedDevice.id || c.target_diagram_device_id === selectedDevice.id
  );

  const directionIcons = {
    Input: <ArrowDown className="w-3 h-3" />,
    Output: <ArrowUp className="w-3 h-3" />,
    Bidirectional: <ArrowLeftRight className="w-3 h-3" />
  };

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col text-white">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Connections</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {device && (
          <div>
            <h3 className="font-semibold mb-2">{device.model}</h3>
            <p className="text-sm text-gray-400">{device.brand}</p>
          </div>
        )}

        <Card className="bg-gray-750 border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Create Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">From Port</Label>
              <Select value={sourceIOId} onValueChange={setSourceIOId}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  {deviceIOs.map((io) => (
                    <SelectItem
                      key={io.id}
                      value={io.id}
                      disabled={occupiedIOs.has(io.id)}
                    >
                      <div className="flex items-center gap-2">
                        {directionIcons[io.direction]}
                        {io.label} - {io.connector_type} {io.gender} ({io.direction})
                        {occupiedIOs.has(io.id) && <Badge variant="destructive" className="ml-auto">Used</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">To Device</Label>
              <Select value={targetDeviceId} onValueChange={(val) => {
                setTargetDeviceId(val);
                setTargetIOId("");
              }}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {diagramDevices
                    .filter(d => d.id !== selectedDevice.id)
                    .map((dd) => {
                      const dev = allDevices.find(d => d.id === dd.device_id);
                      return (
                        <SelectItem key={dd.id} value={dd.id}>
                          {dev?.model || 'Unknown'}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {targetDeviceId && (
              <div className="space-y-2">
                <Label className="text-gray-300">To Port</Label>
                <Select value={targetIOId} onValueChange={setTargetIOId}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select port" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetIOs.map((io) => (
                      <SelectItem
                        key={io.id}
                        value={io.id}
                        disabled={occupiedIOs.has(io.id)}
                      >
                        <div className="flex items-center gap-2">
                          {directionIcons[io.direction]}
                          {io.label} - {io.connector_type} {io.gender} ({io.direction})
                          {occupiedIOs.has(io.id) && <Badge variant="destructive" className="ml-auto">Used</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {compatibility?.compatible && (
              <Alert className="bg-green-900 border-green-700">
                <AlertDescription className="text-green-200">
                  ✓ Cable needed: <strong>{compatibility.cableType}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300">Cable Label (Optional)</Label>
              <Input
                value={cableLabel}
                onChange={(e) => setCableLabel(e.target.value)}
                placeholder="e.g., Cable #1"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {compatibility && !compatibility.compatible && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{compatibility.message}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleCreateConnection}
              disabled={!sourceIOId || !targetIOId || !compatibility?.compatible || createConnectionMutation.isPending}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {createConnectionMutation.isPending ? 'Creating...' : 'Create Connection'}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="font-semibold mb-3">Existing Connections</h3>
          <div className="space-y-2">
            {deviceConnections.map((conn) => {
              const isSource = conn.source_diagram_device_id === selectedDevice.id;

              const ioIdOnThisDevice = isSource ? conn.source_io_id : conn.target_io_id;
              const ioOnThisDevice = allIOs.find(io => io.id === ioIdOnThisDevice);

              const otherDiagramDeviceId = isSource ? conn.target_diagram_device_id : conn.source_diagram_device_id;
              const otherDiagramDevice = diagramDevices.find(dd => dd.id === otherDiagramDeviceId);
              const otherDevice = allDevices.find(d => d.id === otherDiagramDevice?.device_id);

              const ioIdOnOtherDevice = isSource ? conn.target_io_id : conn.source_io_id;
              const ioOnOtherDevice = allIOs.find(io => io.id === ioIdOnOtherDevice);

              return (
                <Card key={conn.id} className="bg-gray-750 border-gray-600">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                          {isSource ? <ArrowUp className="w-4 h-4 text-green-400" /> : <ArrowDown className="w-4 h-4 text-yellow-400" />}
                          {ioOnThisDevice?.label || 'Unknown Port'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {isSource ? 'to' : 'from'} {otherDevice?.model || 'Unknown Device'} ({ioOnOtherDevice?.label || 'Unknown Port'})
                        </p>
                        {conn.cable_label && (
                          <Badge variant="outline" className="text-xs mt-2">
                            {conn.cable_label}
                          </Badge>
                        )}
                        {conn.notes && (
                          <p className="text-xs text-gray-400 mt-1">{conn.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this connection?')) {
                            deleteConnectionMutation.mutate(conn.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {deviceConnections.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No connections yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
