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

async function create<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

async function update<T>(endpoint: string, id: string, data: any): Promise<T> {
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
    list: () => list('/devices'),
    get: (id: string) => get('/devices', id),
    create: (data: any) => create('/devices', data),
    update: (id: string, data: any) => update('/devices', id, data),
    delete: (id: string) => remove('/devices', id),
  },
  deviceIOs: {
    list: (deviceId?: string) => list('/device-ios', deviceId ? { device_id: deviceId } : undefined),
    create: (data: any) => create('/device-ios', data),
    update: (id: string, data: any) => update('/device-ios', id, data),
    delete: (id: string) => remove('/device-ios', id),
  },
  diagrams: {
    list: () => list('/diagrams'),
    get: (id: string) => get('/diagrams', id),
    create: (data: any) => create('/diagrams', data),
    update: (id: string, data: any) => update('/diagrams', id, data),
    delete: (id: string) => remove('/diagrams', id),
  },
  diagramDevices: {
    list: (diagramId?: string) => list('/diagram-devices', diagramId ? { diagram_id: diagramId } : undefined),
    create: (data: any) => create('/diagram-devices', data),
    update: (id: string, data: any) => update('/diagram-devices', id, data),
    delete: (id: string) => remove('/diagram-devices', id),
  },
  connections: {
    list: (diagramId?: string) => list('/connections', diagramId ? { diagram_id: diagramId } : undefined),
    create: (data: any) => create('/connections', data),
    delete: (id: string) => remove('/connections', id),
  },
  uploadFile,
};