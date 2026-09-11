import React from 'react';
import { createRoot } from 'react-dom/client';
import { CatalogApp } from '../ui/App';
import './brand.css';
import type { Api } from '../ui/types';

let token = '';
let refresh: Promise<void> | null = null;
const base = '/api/catalog-editor';
async function refreshSession() {
  if (!refresh) refresh = fetch(`${base}/auth/refresh`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(async res => { const data = await res.json(); if (!res.ok) throw Object.assign(new Error('Please sign in.'), { status: 401 }); token = data.jwt; }).finally(() => { refresh = null; });
  return refresh;
}
const api: Api = async (path, options = {}) => {
  const isAuth = path.startsWith('/auth/');
  if (!token && !isAuth) await refreshSession();
  const execute = () => fetch(`${base}${path}`, { method: options.method || 'GET', credentials: 'same-origin', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) }, ...(options.body ? { body: options.body instanceof FormData ? options.body : JSON.stringify(options.body) } : {}) });
  let response = await execute();
  if (response.status === 401 && (!isAuth || path === '/auth/logout')) { await refreshSession(); response = await execute(); }
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error?.message || 'Request failed.'), { status: response.status, details: result.error?.details });
  if (result.jwt) token = result.jwt;
  if (path === '/auth/logout') token = '';
  return result.data ?? result;
};
createRoot(document.getElementById('root')!).render(<CatalogApp api={api} portal />);
