export interface Device {
  id: string;
  brand: string;
  model: string;
  category: string;
  image_url?: string;
  description?: string;
  created_date: string;
  updated_date: string;
}

export interface DeviceIO {
  id: string;
  device_id: string;
  label: string;
  connector_type: string;
  gender: 'Male' | 'Female' | 'N/A';
  direction: 'Input' | 'Output' | 'Bidirectional';
  signal_type: string;
  created_date: string;
  updated_date: string;
}

export interface Diagram {
  id: string;
  name: string;
  description?: string;
  client_name?: string;
  created_date: string;
  updated_date: string;
}

export interface DiagramDevice {
  id: string;
  diagram_id: string;
  device_id: string;
  position_x: number;
  position_y: number;
  rotation: number;
  created_date: string;
  updated_date: string;
}

export interface Connection {
  id: string;
  diagram_id: string;
  source_diagram_device_id: string;
  source_io_id: string;
  target_diagram_device_id: string;
  target_io_id: string;
  cable_label?: string;
  cable_length?: string;
  notes?: string;
  created_date: string;
  updated_date: string;
}