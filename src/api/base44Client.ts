import { api } from '@/api/client';
import type { Device, DeviceIO, Diagram, CreateDevicePayload, UpdateDevicePayload, CreateDeviceIOPayload, CreateDiagramPayload, UpdateDiagramPayload, CreateDiagramDevicePayload, UpdateDiagramDevicePayload, CreateConnectionPayload } from '@/types';

type OrderKey = '-created_date' | 'created_date' | '-updated_date' | 'updated_date' | string | undefined;
type SortableValue = string | number | boolean | null | undefined;

function getSortableValue(item: Device | Diagram, key?: string): SortableValue {
  if (!key) return undefined;
  // Cast through unknown so we can treat the object as an indexable record just for sorting.
  return (item as unknown as Record<string, SortableValue>)[key];
}

function toComparableValue(value: SortableValue): string | number {
  if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)) {
    return Date.parse(value);
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (value == null) return '';
  return value;
}

function sortByKey<T extends Device | Diagram>(items: T[], order?: OrderKey): T[] {
  if (!order) return items;
  const desc = order.startsWith('-');
  const key = desc ? order.slice(1) : order;
  return [...items].sort((a, b) => {
    const av = getSortableValue(a, key);
    const bv = getSortableValue(b, key);
    if (av === bv) return 0;
    const aVal = toComparableValue(av);
    const bVal = toComparableValue(bv);
    if (aVal === bVal) return 0;
    const cmp = aVal > bVal ? 1 : -1;
    return desc ? -cmp : cmp;
  });
}

async function listDevices(order?: OrderKey) {
  const items = await api.devices.list();
  return sortByKey(items, order);
}

async function listDeviceIOs() {
  return api.deviceIOs.list();
}

async function filterDeviceIOs(params: { device_id?: string }) {
  if (params?.device_id) {
    return api.deviceIOs.list(params.device_id);
  }
  const all = await api.deviceIOs.list();
  return all.filter((io: DeviceIO) => Object.entries(params || {}).every(([k, v]) => String(io[k as keyof DeviceIO]) === String(v)));
}

async function listDiagrams(order?: OrderKey) {
  const items = await api.diagrams.list();
  return sortByKey(items, order);
}

async function filterDiagrams(params: { id?: string }) {
  if (params?.id) {
    const item = await api.diagrams.get(params.id);
    return item ? [item] : [];
  }
  const all = await api.diagrams.list();
  return all.filter((d: Diagram) => Object.entries(params || {}).every(([k, v]) => String(d[k as keyof Diagram]) === String(v)));
}

async function listDiagramDevices(params?: { diagram_id?: string }) {
  if (params?.diagram_id) return api.diagramDevices.list(params.diagram_id);
  return api.diagramDevices.list();
}

async function listConnections(params?: { diagram_id?: string }) {
  if (params?.diagram_id) return api.connections.list(params.diagram_id);
  return api.connections.list();
}

export const base44 = {
  entities: {
    Device: {
      list: (order?: OrderKey) => listDevices(order),
      filter: async (params: { id?: string }) => {
        if (params?.id) {
          const d = await api.devices.get(params.id);
          return d ? [d] : [];
        }
        const all = await api.devices.list();
        return all.filter((it: Device) => Object.entries(params || {}).every(([k, v]) => String(it[k as keyof Device]) === String(v)));
      },
      create: (data: CreateDevicePayload) => api.devices.create(data),
      update: (id: string, data: UpdateDevicePayload) => api.devices.update(id, data),
      delete: (id: string) => api.devices.delete(id),
    },
    DeviceIO: {
      list: () => listDeviceIOs(),
      filter: (params: { device_id?: string }) => filterDeviceIOs(params),
      create: (data: CreateDeviceIOPayload) => api.deviceIOs.create(data),
      update: (id: string, data: Partial<CreateDeviceIOPayload>) => api.deviceIOs.update(id, data),
      delete: (id: string) => api.deviceIOs.delete(id),
    },
    Diagram: {
      list: (order?: OrderKey) => listDiagrams(order),
      filter: (params: { id?: string }) => filterDiagrams(params),
      create: (data: CreateDiagramPayload) => api.diagrams.create(data),
      update: (id: string, data: UpdateDiagramPayload) => api.diagrams.update(id, data),
      delete: (id: string) => api.diagrams.delete(id),
    },
    DiagramDevice: {
      list: (params?: { diagram_id?: string }) => listDiagramDevices(params),
      filter: (params: { diagram_id?: string }) => listDiagramDevices(params),
      create: (data: CreateDiagramDevicePayload) => api.diagramDevices.create(data),
      update: (id: string, data: UpdateDiagramDevicePayload) => api.diagramDevices.update(id, data),
      delete: (id: string) => api.diagramDevices.delete(id),
    },
    Connection: {
      list: (params?: { diagram_id?: string }) => listConnections(params),
      filter: (params: { diagram_id?: string }) => listConnections(params),
      create: (data: CreateConnectionPayload) => api.connections.create(data),
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

