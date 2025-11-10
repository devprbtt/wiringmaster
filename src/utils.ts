export function createPageUrl(name: string): string {
  if (!name) return '/';
  return name.startsWith('/') ? name : `/${name}`;
}

