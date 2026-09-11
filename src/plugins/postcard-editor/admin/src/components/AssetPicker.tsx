import { Button, Field, Flex, Modal, Tabs, Typography } from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { useEffect, useRef, useState } from 'react';
import { styled } from 'styled-components';

import type { Asset, BlockData } from './types';

type AssetPickerProps = {
  value: BlockData;
  onChange: (value: BlockData) => void;
  disabled?: boolean;
  label: string;
};

const AssetRow = styled.button`
  align-items: center;
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  display: grid;
  gap: ${({ theme }) => theme.spaces[3]};
  grid-template-columns: 48px minmax(0, 1fr);
  padding: ${({ theme }) => theme.spaces[3]};
  text-align: left;
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary600};
    outline-offset: 2px;
  }
`;

const Thumbnail = styled.img`
  height: 48px;
  object-fit: cover;
  width: 48px;
`;
const AssetGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spaces[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-height: 360px;
  overflow-y: auto;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;


export function entryToAsset(entry: unknown): Asset | null {
  if (!entry || typeof entry !== 'object') return null;
  const value = entry as Record<string, unknown>;
  const attributes = value.attributes && typeof value.attributes === 'object' ? value.attributes as Record<string, unknown> : value;
  if ((typeof value.id !== 'number' && typeof value.id !== 'string') || typeof attributes.public_url !== 'string') return null;
  return {
    id: value.id,
    documentId: typeof value.documentId === 'string' ? value.documentId : typeof attributes.documentId === 'string' ? attributes.documentId : undefined,
    public_url: attributes.public_url,
    original_filename: typeof attributes.original_filename === 'string' ? attributes.original_filename : undefined,
    alt_text: typeof attributes.alt_text === 'string' ? attributes.alt_text : undefined,
    caption: typeof attributes.caption === 'string' ? attributes.caption : undefined,
  };
}

function requestMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data && error.response.data.error && typeof error.response.data.error === 'object' && 'message' in error.response.data.error && typeof error.response.data.error.message === 'string' && error.response.data.error.message) {
    return error.response.data.error.message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export function AssetPicker({ value, onChange, disabled, label }: AssetPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('library');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = value.asset && typeof value.asset === 'object' ? value.asset as Record<string, unknown> : null;
  const { get, post } = useFetchClient();

  const loadAssets = async (search = '') => {
    setLoading(true);
    setLibraryError('');
    try {
      const encodedSearch = encodeURIComponent(search.trim());
      const searchFilters = encodedSearch
        ? `&filters[$or][0][original_filename][$containsi]=${encodedSearch}&filters[$or][1][alt_text][$containsi]=${encodedSearch}&filters[$or][2][caption][$containsi]=${encodedSearch}`
        : '';
      const response = await get<Record<string, unknown>>(`/content-manager/collection-types/api::editorial-asset.editorial-asset?pageSize=24&sort=createdAt:desc&filters[mime_type][$startsWith]=image%2F${searchFilters}`);
      const payload = response.data;
      const data = payload.data as Record<string, unknown> | unknown[] | undefined;
      const entries = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : Array.isArray(payload.results) ? payload.results : [];
      setAssets(entries.map(entryToAsset).filter((entry): entry is Asset => entry !== null));
    } catch (error) {
      setLibraryError(requestMessage(error, 'Unable to load EditorialAssets.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || tab !== 'library') return undefined;
    const timeout = window.setTimeout(() => void loadAssets(query), 200);
    return () => window.clearTimeout(timeout);
  }, [open, query, tab]);

  const choose = (asset: Asset) => {
    onChange({ ...value, src: asset.public_url, assetId: asset.id, asset: { id: asset.id, public_url: asset.public_url, alt_text: asset.alt_text ?? '', caption: asset.caption ?? '' }, alt: typeof value.alt === 'string' && value.alt ? value.alt : asset.alt_text ?? '', caption: typeof value.caption === 'string' && value.caption ? value.caption : asset.caption ?? '' });
    setOpen(false);
  };

  const remove = () => {
    const { asset, assetId, ...media } = value;
    onChange({ ...media, src: '', alt: '', caption: '' });
  };

  const createAsset = async () => {
    if (!file) {
      setUploadMessage('Choose a file before creating an asset.');
      return;
    }
    if (!alt.trim()) {
      setUploadMessage('Alt text is required for every image asset.');
      return;
    }

    setUploading(true);
    setUploadMessage('Uploading asset…');
    try {
      const uploadData = new FormData();
      uploadData.append('files', file);
      const uploadResponse = await post<unknown>('/upload', uploadData);
      const uploaded = uploadResponse.data;
      const upload = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (!upload || typeof upload !== 'object' || !('url' in upload) || !('mime' in upload) || typeof upload.url !== 'string' || typeof upload.mime !== 'string') {
        throw new Error('Upload response did not include usable media.');
      }
      const publicUrl = new URL(upload.url, window.location.origin).toString();
      const width = 'width' in upload && typeof upload.width === 'number' ? upload.width : undefined;
      const height = 'height' in upload && typeof upload.height === 'number' ? upload.height : undefined;
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      const checksum = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
      const assetData = { object_key: `postcard/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`, public_url: publicUrl, original_filename: file.name.slice(0, 255), mime_type: upload.mime.slice(0, 127), byte_size: file.size, checksum, status: 'pending', width, height, alt_text: alt.trim(), caption: caption.trim() || alt.trim(), rights: 'RomeWithMe editorial', source: 'admin' };
      const assetResponse = await post<Record<string, unknown>>('/postcard-editor/editorial-assets', assetData);
      const created = entryToAsset(assetResponse.data.data);
      if (!created) throw new Error('EditorialAsset response was invalid.');
      choose(created);
      setAssets((current) => [created, ...current]);
      setFile(null);
      setAlt('');
      setCaption('');
      setUploadMessage('');
      if (fileInput.current) fileInput.current.value = '';
    } catch (error) {
      setUploadMessage(requestMessage(error, 'Asset creation failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Flex direction="column" alignItems="flex-start" gap={2} paddingTop={2} width="100%">
      {selected && typeof selected.public_url === 'string' ? (
        <Flex gap={3} alignItems="center" borderColor="neutral200" hasRadius padding={2} width="100%">
          <Thumbnail src={selected.public_url} alt="" />
          <Flex direction="column" gap={1} flex="1" minWidth={0} alignItems="flex-start">
            <Typography fontWeight="bold" ellipsis>{typeof selected.original_filename === 'string' ? selected.original_filename : typeof selected.alt_text === 'string' ? selected.alt_text : 'Selected asset'}</Typography>
            <Typography variant="omega" textColor="neutral600" ellipsis>{selected.public_url}</Typography>
          </Flex>
          <Button variant="tertiary" size="S" onClick={() => setOpen(true)} disabled={disabled}>Change</Button>
          <Button variant="danger-light" size="S" startIcon={<Trash />} onClick={remove} disabled={disabled}>Remove</Button>
        </Flex>
      ) : (
        <Button variant="tertiary" size="S" startIcon={<Plus />} onClick={() => setOpen(true)} disabled={disabled}>Select or upload</Button>
      )}
      <Modal.Root open={open} onOpenChange={setOpen}>
        <Modal.Content style={{ maxWidth: '720px', width: 'calc(100vw - 48px)' }}>
          <Modal.Header><Modal.Title>Select EditorialAsset</Modal.Title></Modal.Header>
          <Modal.Body>
            <Tabs.Root value={tab} onValueChange={setTab}>
              <Tabs.List aria-label={`${label} asset source`}><Tabs.Trigger value="library">Library</Tabs.Trigger><Tabs.Trigger value="upload">Upload new</Tabs.Trigger></Tabs.List>
              <Tabs.Content value="library">
                <Flex direction="column" alignItems="stretch" gap={3} paddingTop={3}>
                  <Field.Root name={`${label}-search`}>
                    <Field.Label>Search assets</Field.Label>
                    <Field.Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filename, alt text, or caption" />
                  </Field.Root>
                  {loading && <Flex direction="column" alignItems="flex-start" gap={2}><Typography textColor="neutral600">Loading assets…</Typography><Flex background="neutral150" height="48px" width="100%" /></Flex>}
                  {libraryError && <Flex gap={3} alignItems="flex-start"><Typography textColor="danger600">{libraryError}</Typography><Button variant="tertiary" size="S" onClick={() => void loadAssets(query)}>Retry</Button></Flex>}
                  {!loading && !libraryError && assets.length === 0 && <Flex direction="column" gap={2} alignItems="flex-start"><Typography textColor="neutral600">{query.trim() ? 'No EditorialAssets match that search.' : 'No EditorialAssets are available.'}</Typography><Button variant="secondary" size="S" onClick={() => setTab('upload')}>Upload new</Button></Flex>}
                  {!loading && !libraryError && assets.length > 0 && <AssetGrid>{assets.map((asset) => <AssetRow key={String(asset.id)} type="button" onClick={() => choose(asset)}><Thumbnail src={asset.public_url} alt="" /><Flex direction="column" gap={1} minWidth={0} alignItems="flex-start"><Typography fontWeight="bold" ellipsis>{asset.original_filename ?? asset.alt_text ?? String(asset.id)}</Typography><Typography variant="omega" textColor="neutral600" ellipsis>{asset.alt_text ?? asset.public_url}</Typography></Flex></AssetRow>)}</AssetGrid>}
                </Flex>
              </Tabs.Content>
              <Tabs.Content value="upload">
                <Flex direction="column" alignItems="stretch" gap={3} paddingTop={3}>
                  <Field.Root name={`${label}-file`}><Field.Label>File</Field.Label><Field.Input ref={fileInput} type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={uploading} /></Field.Root>
                  <Field.Root name={`${label}-alt`} required><Field.Label>Alt text</Field.Label><Field.Input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Describe the image" disabled={uploading} /></Field.Root>
                  <Field.Root name={`${label}-caption`}><Field.Label>Caption</Field.Label><Field.Input value={caption} onChange={(event) => setCaption(event.target.value)} disabled={uploading} /></Field.Root>
                  <Flex direction="column" alignItems="flex-start" gap={2}><Button size="S" onClick={() => void createAsset()} disabled={uploading || !file}>{uploading ? 'Creating…' : 'Upload asset'}</Button>{uploadMessage && <Typography variant="omega" textColor={uploadMessage.includes('failed') || uploadMessage.includes('required') || uploadMessage.includes('Choose') ? 'danger600' : 'neutral600'} role="status">{uploadMessage}</Typography>}</Flex>
                </Flex>
              </Tabs.Content>
            </Tabs.Root>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </Flex>
  );
}
