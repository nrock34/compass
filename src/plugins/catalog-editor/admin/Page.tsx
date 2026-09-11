import React, { useEffect, useMemo } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { CatalogApp } from '../ui/App';
import type { Api } from '../ui/types';

export default function Page() {
  useEffect(() => { document.title = 'Catalog editor | Strapi'; }, []);
  const client = useFetchClient() as ReturnType<typeof useFetchClient> & { put(url: string, data?: unknown): Promise<{ data: any }> };
  const api = useMemo<Api>(() => async (path, options = {}) => {
    try {
      const url = `/catalog-editor${path}`;
      const response = options.method === 'PUT' ? await client.put(url, options.body) : options.method === 'POST' ? await client.post(url, options.body) : await client.get(url);
      return (response.data as { data: any }).data;
    } catch (e: any) { const error = e.response?.data?.error; throw Object.assign(new Error(error?.message || e.message), { status: e.response?.status, details: error?.details }); }
  }, [client]);
  return <CatalogApp api={api} />;
}
