import { api } from '@/api/client';

type OrderKey = '-created_date' | 'created_date' | '-updated_date' | 'updated_date' | string | undefined;

function sortByKey<T extends Record<string, any>>(items: T[], order?: OrderKey): T[] {
  if (!order) return items;
  const desc = order.startsWith('-');
  const key = desc ? order.slice(1) : order;
  return [...items].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av === bv) return 0;
    const aVal = typeof av === 'string' && /\d{4}-\d{2}-\d{2}/.test(av) ? Date.parse(av) : av;
    const bVal = typeof bv === 'string' && /\d{4}-\d{2}-\d{2}/.test(bv) ? Date.parse(bv) : bv;
    const cmp = aVal > bVal ? 1 : -1;
    return desc ? -cmp : cmp;
  });
}

async function listDevices(order?: OrderKey) {
  const items = (await api.devices.list()) as any[];
  return sortByKey(items as any[], order) as any;
}

async function listDeviceIOs() {
  return api.deviceIOs.list() as any;
}

async function filterDeviceIOs(params: Record<string, any>) {
  if (params?.device_id) {
    return api.deviceIOs.list(String(params.device_id));
  }
  const all = await api.deviceIOs.list();
  return all.filter((io: any) => Object.entries(params || {}).every(([k, v]) => String(io[k]) === String(v)));
}

async function listDiagrams(order?: OrderKey) {
  const items = (await api.diagrams.list()) as any[];
  return sortByKey(items as any[], order) as any;
}

async function filterDiagrams(params: Record<string, any>) {
  if (params?.id) {
    const item = await api.diagrams.get(String(params.id));
    return item ? [item] : [];
  }
  const all = await api.diagrams.list();
  return all.filter((d: any) => Object.entries(params || {}).every(([k, v]) => String(d[k]) === String(v)));
}

async function listDiagramDevices(params?: Record<string, any>) {
  if (params?.diagram_id) return api.diagramDevices.list(String(params.diagram_id));
  return api.diagramDevices.list();
}

async function listConnections(params?: Record<string, any>) {
  if (params?.diagram_id) return api.connections.list(String(params.diagram_id));
  return api.connections.list();
}

export const base44 = {
  entities: {
    Device: {
      list: (order?: OrderKey) => listDevices(order),
      filter: async (params: Record<string, any>) => {
        if (params?.id) {
          const d = await api.devices.get(String(params.id));
          return d ? [d] : [];
        }
        const all = await api.devices.list();
        return all.filter((it: any) => Object.entries(params || {}).every(([k, v]) => String(it[k]) === String(v)));
      },
      create: (data: any) => api.devices.create(data),
      update: (id: string, data: any) => api.devices.update(id, data),
      delete: (id: string) => api.devices.delete(id),
    },
    DeviceIO: {
      list: () => listDeviceIOs(),
      filter: (params: Record<string, any>) => filterDeviceIOs(params),
      create: (data: any) => api.deviceIOs.create(data),
      update: (id: string, data: any) => api.deviceIOs.update(id, data),
      delete: (id: string) => api.deviceIOs.delete(id),
    },
    Diagram: {
      list: (order?: OrderKey) => listDiagrams(order),
      filter: (params: Record<string, any>) => filterDiagrams(params),
      create: (data: any) => api.diagrams.create(data),
      update: (id: string, data: any) => api.diagrams.update(id, data),
      delete: (id: string) => api.diagrams.delete(id),
    },
    DiagramDevice: {
      list: (params?: Record<string, any>) => listDiagramDevices(params),
      filter: (params: Record<string, any>) => listDiagramDevices(params),
      create: (data: any) => api.diagramDevices.create(data),
      update: (id: string, data: any) => api.diagramDevices.update(id, data),
      delete: (id: string) => api.diagramDevices.delete(id),
    },
    Connection: {
      list: (params?: Record<string, any>) => listConnections(params),
      filter: (params: Record<string, any>) => listConnections(params),
      create: (data: any) => api.connections.create(data),
      delete: (id: string) => api.connections.delete(id),
    },
  },
  integrations: {
    Core: {
      UploadFile: ({ file }: { file: File }) => api.uploadFile(file),
    },
  },
};

export default base44;

