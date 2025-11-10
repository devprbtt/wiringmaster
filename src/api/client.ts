import type {
  Device,
  DeviceIO,
  Diagram,
  DiagramDevice,
  Connection,
  CreateConnectionPayload,
  CreateDevicePayload,
  UpdateDevicePayload,
  CreateDiagramPayload,
  UpdateDiagramPayload,
  CreateDiagramDevicePayload,
  UpdateDiagramDevicePayload,
  CreateDeviceIOPayload,
} from '@/types';

const API_BASE = '/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

// Generic CRUD operations
async function list<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const response = await fetch(url.toString());
  return handleResponse(response);
}

async function get<T>(endpoint: string, id: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}/${id}`);
  return handleResponse(response);
}

type RequestBody = Record<string, unknown>;

async function create<T>(endpoint: string, data: RequestBody): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

async function update<T>(endpoint: string, id: string, data: RequestBody): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

async function remove(endpoint: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE}${endpoint}/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// Upload file
async function uploadFile(file: File): Promise<{ file_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  return handleResponse(response);
}

// Export API client
export const api = {
  devices: {
    list: () => list<Device>('/devices'),
    get: (id: string) => get<Device>('/devices', id),
    create: (data: CreateDevicePayload) => create<Device>('/devices', data),
    update: (id: string, data: UpdateDevicePayload) => update<Device>('/devices', id, data),
    delete: (id: string) => remove('/devices', id),
  },
  deviceIOs: {
    list: (deviceId?: string) => list<DeviceIO>('/device-ios', deviceId ? { device_id: deviceId } : undefined),
    create: (data: CreateDeviceIOPayload) => create<DeviceIO>('/device-ios', data),
    update: (id: string, data: Partial<CreateDeviceIOPayload>) => update<DeviceIO>('/device-ios', id, data),
    delete: (id: string) => remove('/device-ios', id),
  },
  diagrams: {
    list: () => list<Diagram>('/diagrams'),
    get: (id: string) => get<Diagram>('/diagrams', id),
    create: (data: CreateDiagramPayload) => create<Diagram>('/diagrams', data),
    update: (id: string, data: UpdateDiagramPayload) => update<Diagram>('/diagrams', id, data),
    delete: (id: string) => remove('/diagrams', id),
  },
  diagramDevices: {
    list: (diagramId?: string) => list<DiagramDevice>('/diagram-devices', diagramId ? { diagram_id: diagramId } : undefined),
    create: (data: CreateDiagramDevicePayload) => create<DiagramDevice>('/diagram-devices', data),
    update: (id: string, data: UpdateDiagramDevicePayload) => update<DiagramDevice>('/diagram-devices', id, data),
    delete: (id: string) => remove('/diagram-devices', id),
  },
  connections: {
    list: (diagramId?: string) => list<Connection>('/connections', diagramId ? { diagram_id: diagramId } : undefined),
    create: (data: CreateConnectionPayload) => create<Connection>('/connections', data),
    delete: (id: string) => remove('/connections', id),
  },
  uploadFile,
};
