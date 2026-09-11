import { Field } from '@strapi/design-system';
import { useFetchClient, useField } from '@strapi/strapi/admin';
import { useEffect, useMemo, useState } from 'react';

import { AssetPicker, entryToAsset } from './AssetPicker';
import type { Asset, BlockData } from './types';

type RelationReference = {
  id: number | string;
  documentId?: string;
  label?: string;
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

type EditorialAssetInputProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
};

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

function relationReference(asset: Asset): RelationReference | null {
  if (!asset.documentId) return null;
  return {
    id: asset.id,
    documentId: asset.documentId,
    label: asset.original_filename ?? asset.alt_text ?? asset.documentId,
    __temp_key__: `editorial-asset-${crypto.randomUUID()}`,
    apiData: { id: asset.id, documentId: asset.documentId, isTemporary: true },
  };
}

export function EditorialAssetInput({ name, label, hint, required, disabled }: EditorialAssetInputProps) {
  const { value, error, onChange } = useField(name);
  const relation = value && typeof value === 'object' ? value as RelationValue : {};
  const [selected, setSelected] = useState<Asset | null>(null);
  const [serverDocumentId, setServerDocumentId] = useState<string>();
  const [loadError, setLoadError] = useState('');
  const { get } = useFetchClient();
  const connectedDocumentId = useMemo(
    () => (relation.connect ?? []).map(referenceDocumentId).find((documentId): documentId is string => Boolean(documentId)),
    [relation.connect],
  );

  useEffect(() => {
    const route = currentDocumentRoute();
    let active = true;

    void (async () => {
      try {
        setLoadError('');
        let assetDocumentId = connectedDocumentId;
        if (!assetDocumentId && route?.documentId) {
          const relationsResponse = await get<{ results?: RelationReference[] }>(
            `/content-manager/relations/${encodeURIComponent(route.model)}/${encodeURIComponent(route.documentId)}/${encodeURIComponent(name.split('.').at(-1) ?? name)}?pageSize=1`,
          );
          assetDocumentId = (relationsResponse.data.results ?? []).map(referenceDocumentId).find((documentId): documentId is string => Boolean(documentId));
          if (active) setServerDocumentId(assetDocumentId);
        }
        if (!assetDocumentId) {
          if (active) setSelected(null);
          return;
        }

        const response = await get<{ data?: unknown }>(
          `/content-manager/collection-types/api::editorial-asset.editorial-asset/${encodeURIComponent(assetDocumentId)}`,
        );
        const asset = entryToAsset(response.data.data ?? response.data);
        if (!asset) throw new Error('The selected EditorialAsset response was invalid.');
        if (active) setSelected(asset);
      } catch (requestError) {
        if (!active) return;
        setSelected(null);
        setLoadError(requestError instanceof Error && requestError.message
          ? requestError.message
          : 'The selected EditorialAsset could not be loaded.');
      }
    })();

    return () => { active = false; };
  }, [connectedDocumentId, name]);

  const pickerValue: BlockData = selected
    ? {
      src: selected.public_url,
      assetId: selected.id,
      asset: selected,
      alt: selected.alt_text ?? '',
      caption: selected.caption ?? '',
    }
    : {};

  const updateSelection = (next: BlockData) => {
    const nextAsset = entryToAsset(next.asset);
    if (!nextAsset) {
      const selectedDocumentId = selected?.documentId;
      onChange(`${name}.connect`, (relation.connect ?? []).filter((reference) => referenceDocumentId(reference) !== selectedDocumentId));
      if (serverDocumentId && !(relation.disconnect ?? []).some((reference) => referenceDocumentId(reference) === serverDocumentId)) {
        onChange(`${name}.disconnect`, [...relation.disconnect ?? [], { id: selected?.id ?? serverDocumentId, documentId: serverDocumentId, apiData: { id: selected?.id ?? serverDocumentId, documentId: serverDocumentId } }]);
      }
      setSelected(null);
      return;
    }

    const reference = relationReference(nextAsset);
    if (!reference) {
      setLoadError('The selected EditorialAsset is missing its document identifier.');
      return;
    }
    if (serverDocumentId && serverDocumentId !== nextAsset.documentId && !(relation.disconnect ?? []).some((entry) => referenceDocumentId(entry) === serverDocumentId)) {
      onChange(`${name}.disconnect`, [...relation.disconnect ?? [], { id: selected?.id ?? serverDocumentId, documentId: serverDocumentId, apiData: { id: selected?.id ?? serverDocumentId, documentId: serverDocumentId } }]);
    }
    onChange(`${name}.connect`, [reference]);
    setSelected(nextAsset);
    setLoadError('');
  };

  return (
    <Field.Root name={name} required={required} error={error ?? loadError} hint={hint}>
      <Field.Label>{label}</Field.Label>
      <AssetPicker value={pickerValue} onChange={updateSelection} disabled={disabled} label={label} />
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
}
