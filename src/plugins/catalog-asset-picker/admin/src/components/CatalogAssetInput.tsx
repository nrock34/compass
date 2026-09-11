import { Box, Button, Field, Flex, Modal, Tabs, Typography } from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';
import { useFetchClient, useField } from '@strapi/strapi/admin';
import { useEffect, useMemo, useRef, useState } from 'react';
import { styled } from 'styled-components';

type CatalogAsset = {
  id: number | string;
  documentId: string;
  name: string;
  alt_text: string;
  caption?: string;
  file?: {
    id?: number | string;
    name?: string;
    url?: string;
    formats?: { thumbnail?: { url?: string } };
  };
};

type RelationReference = {
  id: number | string;
  documentId?: string;
  label?: string;
  name?: string;
  __temp_key__?: string;
  apiData?: {
    id: number | string;
    documentId: string;
    isTemporary?: boolean;
  };
};

type RelationValue = {
  connect?: RelationReference[];
  disconnect?: RelationReference[];
};

type CatalogAssetInputProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  attribute: { relation: string; target?: string };
};

const AssetButton = styled.button`
  align-items: center;
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  display: grid;
  gap: ${({ theme }) => theme.spaces[3]};
  grid-template-columns: 64px minmax(0, 1fr) auto;
  padding: ${({ theme }) => theme.spaces[3]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary600};
    outline-offset: 2px;
  }

  &[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.colors.primary600};
  }
`;

const Thumbnail = styled.img`
  background: ${({ theme }) => theme.colors.neutral150};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  height: 64px;
  object-fit: cover;
  width: 64px;
`;

const SelectedGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spaces[3]};
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  width: 100%;
`;

function responseMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response;
    if (response && typeof response === 'object' && 'data' in response) {
      const data = response.data;
      if (data && typeof data === 'object' && 'error' in data) {
        const apiError = data.error;
        if (apiError && typeof apiError === 'object' && 'message' in apiError && typeof apiError.message === 'string') {
          return apiError.message;
        }
      }
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseAsset(entry: unknown): CatalogAsset | null {
  if (!entry || typeof entry !== 'object') return null;
  const value = entry as Record<string, unknown>;
  if ((typeof value.id !== 'number' && typeof value.id !== 'string') || typeof value.documentId !== 'string' || typeof value.name !== 'string' || typeof value.alt_text !== 'string') return null;
  const file = value.file && typeof value.file === 'object' ? value.file as CatalogAsset['file'] : undefined;
  return {
    id: value.id,
    documentId: value.documentId,
    name: value.name,
    alt_text: value.alt_text,
    caption: typeof value.caption === 'string' ? value.caption : undefined,
    file,
  };
}

function assetUrl(asset: CatalogAsset): string {
  return asset.file?.formats?.thumbnail?.url ?? asset.file?.url ?? '';
}

function currentDocumentRoute(): { model: string; documentId?: string } | null {
  const parts = window.location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const collectionIndex = parts.indexOf('collection-types');
  if (collectionIndex < 0 || !parts[collectionIndex + 1]) return null;
  const candidate = parts[collectionIndex + 2];
  return {
    model: parts[collectionIndex + 1],
    documentId: candidate && candidate !== 'create' ? candidate : undefined,
  };
}

function referenceDocumentId(reference: RelationReference): string | undefined {
  return reference.apiData?.documentId ?? reference.documentId;
}

function relationReference(asset: CatalogAsset): RelationReference {
  return {
    id: asset.id,
    documentId: asset.documentId,
    name: asset.name,
    label: asset.name,
    __temp_key__: `catalog-asset-${crypto.randomUUID()}`,
    apiData: { id: asset.id, documentId: asset.documentId, isTemporary: true },
  };
}

export function CatalogAssetInput({ name, label, hint, required, disabled, attribute }: CatalogAssetInputProps) {
  const { value, error, onChange } = useField(name);
  const relation = value && typeof value === 'object' ? value as RelationValue : {};
  const multiple = attribute.relation === 'manyToMany';
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('library');
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<CatalogAsset[]>([]);
  const [serverAssets, setServerAssets] = useState<CatalogAsset[]>([]);
  const [pendingAssets, setPendingAssets] = useState<CatalogAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [assetName, setAssetName] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const { get, post } = useFetchClient();

  useEffect(() => {
    if (!file) {
      setUploadPreview('');
      return undefined;
    }
    const preview = URL.createObjectURL(file);
    setUploadPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  const disconnected = useMemo(() => new Set((relation.disconnect ?? []).map(referenceDocumentId).filter(Boolean)), [relation.disconnect]);
  const connectedIds = useMemo(() => new Set((relation.connect ?? []).map(referenceDocumentId).filter(Boolean)), [relation.connect]);
  const selected = useMemo(() => {
    const result = serverAssets.filter((asset) => !disconnected.has(asset.documentId));
    for (const asset of pendingAssets) {
      if (connectedIds.has(asset.documentId) && !result.some((entry) => entry.documentId === asset.documentId)) result.push(asset);
    }
    return result;
  }, [connectedIds, disconnected, pendingAssets, serverAssets]);

  const loadAssets = async (search = '') => {
    setLoading(true);
    setLibraryError('');
    try {
      const response = await get<{ data?: unknown[] }>(`/catalog-asset-picker/assets${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      setAssets((response.data.data ?? []).map(parseAsset).filter((entry): entry is CatalogAsset => entry !== null));
    } catch (requestError) {
      setLibraryError(responseMessage(requestError, 'Catalog assets could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || tab !== 'library') return undefined;
    const timeout = window.setTimeout(() => void loadAssets(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [open, query, tab]);

  useEffect(() => {
    const route = currentDocumentRoute();
    const targetField = name.split('.').at(-1);
    if (!route?.documentId || !targetField) return;
    let active = true;
    void (async () => {
      try {
        const relationsResponse = await get<{ results?: RelationReference[] }>(`/content-manager/relations/${encodeURIComponent(route.model)}/${encodeURIComponent(route.documentId!)}/${encodeURIComponent(targetField)}?pageSize=100`);
        const ids = (relationsResponse.data.results ?? []).map(referenceDocumentId).filter((id): id is string => Boolean(id));
        if (ids.length === 0) {
          if (active) setServerAssets([]);
          return;
        }
        const assetsResponse = await get<{ data?: unknown[] }>(`/catalog-asset-picker/assets?ids=${encodeURIComponent(ids.join(','))}`);
        if (active) setServerAssets((assetsResponse.data.data ?? []).map(parseAsset).filter((entry): entry is CatalogAsset => entry !== null));
      } catch (requestError) {
        if (active) setLibraryError(responseMessage(requestError, 'Selected catalog assets could not be loaded.'));
      }
    })();
    return () => { active = false; };
  }, [name]);

  const disconnect = (asset: CatalogAsset) => {
    const connected = relation.connect ?? [];
    const unsaved = connected.some((reference) => referenceDocumentId(reference) === asset.documentId);
    if (unsaved) {
      onChange(`${name}.connect`, connected.filter((reference) => referenceDocumentId(reference) !== asset.documentId));
      return;
    }
    if (!(relation.disconnect ?? []).some((reference) => referenceDocumentId(reference) === asset.documentId)) {
      onChange(`${name}.disconnect`, [...relation.disconnect ?? [], { id: asset.id, documentId: asset.documentId, apiData: { id: asset.id, documentId: asset.documentId } }]);
    }
  };

  const connect = (asset: CatalogAsset) => {
    if (selected.some((entry) => entry.documentId === asset.documentId)) return;
    setPendingAssets((current) => current.some((entry) => entry.documentId === asset.documentId) ? current : [...current, asset]);
    const nextReference = relationReference(asset);
    if (multiple) {
      onChange(`${name}.connect`, [...relation.connect ?? [], nextReference]);
      return;
    }
    for (const current of selected) disconnect(current);
    onChange(`${name}.connect`, [nextReference]);
    setOpen(false);
  };

  const createAsset = async () => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('Choose an image file.');
      return;
    }
    if (!assetName.trim() || !altText.trim()) {
      setUploadError('Name and alt text are required.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const uploadData = new FormData();
      uploadData.append('files', file);
      const uploadResponse = await post<unknown>('/upload', uploadData);
      const upload = Array.isArray(uploadResponse.data) ? uploadResponse.data[0] : uploadResponse.data;
      if (!upload || typeof upload !== 'object' || !('id' in upload) || (typeof upload.id !== 'number' && typeof upload.id !== 'string')) throw new Error('Upload response did not include a file ID.');
      const uploadedId = upload.id;
      const assetResponse = await post<{ data?: unknown }>('/catalog-asset-picker/assets', {
        name: assetName.trim(),
        fileId: typeof uploadedId === 'string' ? Number(uploadedId) : uploadedId,
        alt_text: altText.trim(),
        caption: caption.trim(),
      });
      const created = parseAsset(assetResponse.data.data);
      if (!created) throw new Error('CatalogAsset response was invalid.');
      setAssets((current) => [created, ...current]);
      connect(created);
      setFile(null);
      setAssetName('');
      setAltText('');
      setCaption('');
      if (fileInput.current) fileInput.current.value = '';
      if (!multiple) setOpen(false);
      else setTab('library');
    } catch (requestError) {
      setUploadError(responseMessage(requestError, 'Catalog asset creation failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field.Root name={name} required={required} error={error} hint={hint}>
      <Flex direction="column" alignItems="stretch" gap={2}>
        <Field.Label>{label}</Field.Label>
        {selected.length > 0 ? (
          <SelectedGrid>
            {selected.map((asset) => (
              <Flex key={asset.documentId} gap={3} alignItems="center" borderColor="neutral200" hasRadius padding={3} background="neutral0">
                <Thumbnail src={assetUrl(asset)} alt="" />
                <Flex direction="column" gap={1} flex="1" minWidth={0}>
                  <Typography fontWeight="bold" ellipsis>{asset.name}</Typography>
                  <Typography variant="omega" textColor="neutral600" ellipsis>{asset.alt_text}</Typography>
                </Flex>
                <Button variant="danger-light" size="S" startIcon={<Trash aria-hidden />} onClick={() => disconnect(asset)} disabled={disabled}>Remove</Button>
              </Flex>
            ))}
          </SelectedGrid>
        ) : (
          <Box borderColor="neutral200" hasRadius padding={4} background="neutral100">
            <Typography variant="omega" textColor="neutral600">No catalog asset selected.</Typography>
          </Box>
        )}
        <Flex gap={2}>
          <Button variant="secondary" size="S" startIcon={<Plus aria-hidden />} onClick={() => setOpen(true)} disabled={disabled}>
            {multiple ? 'Add gallery assets' : selected.length ? 'Change image' : 'Select image'}
          </Button>
        </Flex>
        <Field.Hint />
        <Field.Error />
      </Flex>

      <Modal.Root open={open} onOpenChange={setOpen}>
        <Modal.Content>
          <Modal.Header><Modal.Title>{multiple ? 'Select gallery assets' : 'Select image'}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Tabs.Root value={tab} onValueChange={setTab}>
              <Tabs.List aria-label={`${label} asset source`}>
                <Tabs.Trigger value="library">Catalog assets</Tabs.Trigger>
                <Tabs.Trigger value="upload">Upload new</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="library">
                <Flex direction="column" alignItems="stretch" gap={3} paddingTop={4}>
                  <Field.Root name={`${name}-catalog-search`}>
                    <Field.Label>Search catalog assets</Field.Label>
                    <Field.Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or alt text" />
                  </Field.Root>
                  {loading && <Flex direction="column" gap={2} aria-busy="true"><Box background="neutral150" height="72px" /><Box background="neutral150" height="72px" /></Flex>}
                  {libraryError && <Flex gap={3} alignItems="center"><Typography textColor="danger600" role="status">{libraryError}</Typography><Button variant="tertiary" size="S" onClick={() => void loadAssets(query.trim())}>Retry</Button></Flex>}
                  {!loading && !libraryError && assets.length === 0 && <Flex direction="column" gap={3} alignItems="flex-start"><Typography textColor="neutral600">No catalog assets match this search.</Typography><Button variant="secondary" onClick={() => setTab('upload')}>Upload new</Button></Flex>}
                  {!loading && !libraryError && assets.map((asset) => {
                    const isSelected = selected.some((entry) => entry.documentId === asset.documentId);
                    return <AssetButton key={asset.documentId} type="button" aria-pressed={isSelected} onClick={() => isSelected ? disconnect(asset) : connect(asset)}><Thumbnail src={assetUrl(asset)} alt="" /><Flex direction="column" gap={1} minWidth={0}><Typography fontWeight="bold" ellipsis>{asset.name}</Typography><Typography variant="omega" textColor="neutral600" ellipsis>{asset.alt_text}</Typography></Flex><Typography variant="omega" textColor={isSelected ? 'primary600' : 'neutral600'}>{isSelected ? 'Selected' : multiple ? 'Add' : 'Select'}</Typography></AssetButton>;
                  })}
                </Flex>
              </Tabs.Content>
              <Tabs.Content value="upload">
                <Flex direction="column" alignItems="stretch" gap={4} paddingTop={4}>
                  <Field.Root name={`${name}-catalog-file`} required>
                    <Field.Label>Image file</Field.Label>
                    <Field.Input ref={fileInput} type="file" accept="image/*" onChange={(event) => { const nextFile = event.target.files?.[0] ?? null; setFile(nextFile); if (nextFile && !assetName) setAssetName(nextFile.name.replace(/\.[^.]+$/, '')); }} disabled={uploading} />
                  </Field.Root>
                  <Field.Root name={`${name}-catalog-name`} required><Field.Label>Name</Field.Label><Field.Input value={assetName} onChange={(event) => setAssetName(event.target.value)} disabled={uploading} /></Field.Root>
                  <Field.Root name={`${name}-catalog-alt`} required><Field.Label>Alt text</Field.Label><Field.Input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image" disabled={uploading} /></Field.Root>
                  <Field.Root name={`${name}-catalog-caption`}><Field.Label>Caption</Field.Label><Field.Input value={caption} onChange={(event) => setCaption(event.target.value)} disabled={uploading} /></Field.Root>
                  {file && uploadPreview && <Flex gap={3} alignItems="center"><Thumbnail src={uploadPreview} alt="Preview of selected upload" /><Typography variant="omega" textColor="neutral600">{file.name}</Typography></Flex>}
                  {uploadError && <Typography variant="omega" textColor="danger600" role="status">{uploadError}</Typography>}
                  <Button onClick={() => void createAsset()} disabled={uploading || !file}>{uploading ? 'Uploading…' : 'Upload and select'}</Button>
                </Flex>
              </Tabs.Content>
            </Tabs.Root>
          </Modal.Body>
          {multiple && <Modal.Footer><Button variant="tertiary" onClick={() => setOpen(false)}>Done</Button></Modal.Footer>}
        </Modal.Content>
      </Modal.Root>
    </Field.Root>
  );
}
