import { Button, Field, Flex, IconButton, MenuItem, Modal, SimpleMenu, SingleSelect, SingleSelectOption, Textarea, Typography, VisuallyHidden } from '@strapi/design-system';
import { ArrowDown, ArrowUp, Eye, Image, Layout, Paragraph, Play, Plus, Quotes, Trash } from '@strapi/icons';
import { useField } from '@strapi/strapi/admin';
import { forwardRef, useState } from 'react';
import { styled } from 'styled-components';

import { AssetPicker } from './AssetPicker';
import { Preview } from './Preview';
import type { Block, BlockData, Document } from './types';

type BlockType = 'header' | 'subtext' | 'paragraph' | 'smallText' | 'image' | 'quote' | 'embed' | 'slideshow' | 'poll' | 'layout';
type InputProps = {
  name: string;
  label?: string;
  labelAction?: React.ReactNode;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
};

const blockTypes: readonly [BlockType, string][] = [
  ['header', 'Header'],
  ['subtext', 'Subtext'],
  ['paragraph', 'Paragraph'],
  ['smallText', 'Small Note'],
  ['quote', 'Quote'],
  ['image', 'Image'],
  ['embed', 'Embed'],
  ['slideshow', 'Slideshow'],
  ['poll', 'Poll'],
  ['layout', 'Layout'],
];
const textSizes = [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] as const;
const embedKinds = [['spotify', 'Spotify'], ['youtube', 'YouTube'], ['map', 'Map']] as const;

const Workspace = styled.div<{ $disabled?: boolean; $hasError?: boolean }>`
  background: ${({ theme, $disabled }) => $disabled ? theme.colors.neutral150 : theme.colors.neutral0};
  border: 1px solid ${({ theme, $hasError }) => $hasError ? theme.colors.danger600 : theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.neutral800};

  &:focus-within {
    border-color: ${({ theme, $hasError }) => $hasError ? theme.colors.danger600 : theme.colors.primary600};
    box-shadow: ${({ theme, $hasError }) => $hasError ? theme.colors.danger600 : theme.colors.primary600} 0 0 0 2px;
  }
`;

const WorkspaceGrid = styled.div`
  padding: ${({ theme }) => theme.spaces[4]};
`;

const ColumnsEditor = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spaces[3]};
  grid-template-columns: 1fr;

  ${({ theme }) => theme.breakpoints.medium} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const EditorPane = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spaces[3]};
  min-width: 0;
`;

const BlockFrame = styled.section<{ $nested: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme, $nested }) => $nested ? theme.colors.neutral100 : theme.colors.neutral0};
  min-width: 0;
`;

function blockId(prefix = 'block') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function initialBlock(type: BlockType): Block {
  let data: BlockData;

  switch (type) {
    case 'header':
    case 'subtext':
      data = { text: '', fontSize: 'md' };
      break;
    case 'paragraph':
    case 'smallText':
      data = { text: '' };
      break;
    case 'image':
      data = { src: '', alt: '', caption: '', withBorder: false, withBackground: false, stretched: false };
      break;
    case 'quote':
      data = { text: '', attribution: '' };
      break;
    case 'embed':
      data = { kind: 'spotify', url: '', caption: '' };
      break;
    case 'slideshow':
      data = { slides: [{ src: '', alt: '', caption: '' }] };
      break;
    case 'poll':
      data = { question: '', options: [{ id: blockId('option'), label: '' }, { id: blockId('option'), label: '' }] };
      break;
    case 'layout':
      data = { columns: [{ width: '1fr', blocks: [initialBlock('paragraph')] }, { width: '1fr', blocks: [initialBlock('paragraph')] }] };
      break;
  }

  return { id: blockId(type), type, data };
}

function asDocument(value: unknown): Document {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as Partial<Document>;
    if (candidate.format === 'editorjs' && candidate.version === 1 && Array.isArray(candidate.blocks)) {
      return candidate as Document;
    }
  }

  if (typeof value === 'string' && value.trim()) {
    return { format: 'editorjs', version: 1, blocks: [{ ...initialBlock('paragraph'), data: { text: value.replace(/<[^>]+>/g, ' ').trim() } }] };
  }

  return { format: 'editorjs', version: 1, blocks: [initialBlock('paragraph')] };
}

function labelFor(type: string) {
  return blockTypes.find(([key]) => key === type)?.[1] ?? type;
}

function iconFor(type: string) {
  if (type === 'image' || type === 'slideshow') return <Image aria-hidden />;
  if (type === 'quote') return <Quotes aria-hidden />;
  if (type === 'embed') return <Play aria-hidden />;
  if (type === 'layout') return <Layout aria-hidden />;
  return <Paragraph aria-hidden />;
}

function dataValue(data: BlockData, key: string) {
  return typeof data[key] === 'string' ? data[key] as string : '';
}

function TextField({ blockId: fieldId, label, value, onChange, disabled, multiline = false, placeholder }: { blockId: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean; multiline?: boolean; placeholder?: string }) {
  return (
    <Field.Root name={fieldId}>
      <Field.Label>{label}</Field.Label>
      {multiline ? <Textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} /> : <Field.Input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} />}
    </Field.Root>
  );
}

function SelectField({ blockId: fieldId, label, value, choices, onChange, disabled }: { blockId: string; label: string; value: string; choices: readonly (readonly [string, string])[]; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <Field.Root name={fieldId}>
      <Field.Label>{label}</Field.Label>
      <SingleSelect value={value} onChange={(nextValue) => onChange(String(nextValue))} disabled={disabled}>
        {choices.map(([choice, choiceLabel]) => <SingleSelectOption key={choice || 'default'} value={choice}>{choiceLabel}</SingleSelectOption>)}
      </SingleSelect>
    </Field.Root>
  );
}

type BlockCardProps = {
  block: Block;
  index: number;
  total: number;
  onChange: (block: Block) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  disabled?: boolean;
  nested?: boolean;
};

function BlockCard({ block, index, total, onChange, onMove, onRemove, disabled, nested = false }: BlockCardProps) {
  const setData = (key: string, value: unknown) => onChange({ ...block, data: { ...block.data, [key]: value } });
  const changeType = (type: string) => onChange({ ...initialBlock(type as BlockType), id: block.id, mb: block.mb });
  const typeChoices = nested ? blockTypes.filter(([type]) => type !== 'layout') : blockTypes;
  const updateSlides = (slides: BlockData[]) => setData('slides', slides);
  const layoutColumns = Array.isArray(block.data.columns) ? block.data.columns as BlockData[] : [];
  const rebalanceLayoutWidths = () => setData('columns', layoutColumns.map((column) => ({ ...column, width: '1fr' })));
  const setLayoutColumnCount = (count: number) => {
    const target = Math.max(2, Math.min(4, count));
    const columns: BlockData[] = layoutColumns.map((column) => ({
      ...column,
      blocks: Array.isArray(column.blocks) ? [...column.blocks] : [],
    }));
    while (columns.length < target) {
      columns.push({ width: '1fr', blocks: [initialBlock('paragraph')] });
    }
    if (columns.length > target) {
      const overflow = columns.splice(target);
      const last = columns[target - 1];
      last.blocks = [
        ...(Array.isArray(last.blocks) ? last.blocks : []),
        ...overflow.flatMap((column) => Array.isArray(column.blocks) ? column.blocks : []),
      ];
    }
    setData('columns', columns.map((column) => ({ ...column, width: '1fr' })));
  };
  const removeLayoutColumn = (index: number) => {
    if (layoutColumns.length <= 2) return;
    const columns: BlockData[] = layoutColumns.map((column) => ({
      ...column,
      blocks: Array.isArray(column.blocks) ? [...column.blocks] : [],
    }));
    const destinationIndex = index === 0 ? 1 : index - 1;
    columns[destinationIndex].blocks = [
      ...(Array.isArray(columns[destinationIndex].blocks) ? columns[destinationIndex].blocks : []),
      ...(Array.isArray(columns[index].blocks) ? columns[index].blocks : []),
    ];
    columns.splice(index, 1);
    setData('columns', columns.map((column) => ({ ...column, width: '1fr' })));
  };

  return (
    <BlockFrame $nested={nested}>
      <Flex alignItems="center" background="neutral100" borderColor="neutral200" borderWidth="0 0 1px" gap={2} justifyContent="space-between" padding={3}>
        <Flex alignItems="center" gap={2} minWidth={0}>
          {iconFor(block.type)}
          <Typography fontWeight="bold" ellipsis>{labelFor(block.type)}</Typography>
          <Typography variant="omega" textColor="neutral600">{index + 1} of {total}</Typography>
        </Flex>
        <Flex gap={1} style={{ flexShrink: 0 }}>
          <IconButton size="S" label={`Move ${labelFor(block.type)} block ${index + 1} up`} onClick={() => onMove(-1)} disabled={disabled || index === 0}><ArrowUp /></IconButton>
          <IconButton size="S" label={`Move ${labelFor(block.type)} block ${index + 1} down`} onClick={() => onMove(1)} disabled={disabled || index === total - 1}><ArrowDown /></IconButton>
          <IconButton size="S" label={`Remove ${labelFor(block.type)} block ${index + 1}`} onClick={onRemove} disabled={disabled || total <= 1}><Trash /></IconButton>
        </Flex>
      </Flex>
      <Flex direction="column" alignItems="stretch" gap={3} padding={3}>
        <SelectField blockId={`${block.id}-type`} label="Block type" value={block.type} choices={typeChoices} onChange={changeType} disabled={disabled} />
        {(block.type === 'header' || block.type === 'subtext') && <>
          <TextField blockId={`${block.id}-text`} label="Text" value={dataValue(block.data, 'text')} onChange={(value) => setData('text', value)} multiline disabled={disabled} />
          <SelectField blockId={`${block.id}-font-size`} label="Text size" value={dataValue(block.data, 'fontSize') || 'md'} choices={textSizes} onChange={(value) => setData('fontSize', value)} disabled={disabled} />
        </>}
        {(block.type === 'paragraph' || block.type === 'smallText') && <TextField blockId={`${block.id}-text`} label={block.type === 'paragraph' ? 'Paragraph' : 'Small Note'} value={dataValue(block.data, 'text')} onChange={(value) => setData('text', value)} multiline disabled={disabled} />}
        {block.type === 'quote' && <>
          <TextField blockId={`${block.id}-quote`} label="Quote" value={dataValue(block.data, 'text')} onChange={(value) => setData('text', value)} multiline disabled={disabled} />
          <TextField blockId={`${block.id}-attribution`} label="Attribution" value={dataValue(block.data, 'attribution')} onChange={(value) => setData('attribution', value)} disabled={disabled} />
        </>}
        {block.type === 'image' && <>
          <AssetPicker label={`${block.id}-image`} value={block.data} onChange={(data) => onChange({ ...block, data })} disabled={disabled} />
          <TextField blockId={`${block.id}-alt`} label="Alt text" value={dataValue(block.data, 'alt')} onChange={(value) => setData('alt', value)} disabled={disabled} />
          <TextField blockId={`${block.id}-caption`} label="Caption" value={dataValue(block.data, 'caption')} onChange={(value) => setData('caption', value)} disabled={disabled} />
          <Flex gap={2} style={{ flexWrap: 'wrap' }}>
            {([
              ['withBorder', 'Add border'],
              ['stretched', 'Stretch block'],
              ['withBackground', 'Add background'],
            ] as const).map(([setting, settingLabel]) => (
              <Button
                key={setting}
                size="S"
                variant={block.data[setting] === true ? 'secondary' : 'tertiary'}
                aria-pressed={block.data[setting] === true}
                onClick={() => setData(setting, block.data[setting] !== true)}
                disabled={disabled}
              >
                {settingLabel}
              </Button>
            ))}
          </Flex>
        </>}
        {block.type === 'embed' && <>
          <SelectField blockId={`${block.id}-provider`} label="Provider" value={dataValue(block.data, 'kind') || 'spotify'} choices={embedKinds} onChange={(value) => setData('kind', value)} disabled={disabled} />
          <TextField blockId={`${block.id}-url`} label="URL" value={dataValue(block.data, 'url')} onChange={(value) => setData('url', value)} disabled={disabled} />
          <TextField blockId={`${block.id}-caption`} label="Caption" value={dataValue(block.data, 'caption')} onChange={(value) => setData('caption', value)} disabled={disabled} />
        </>}
        {block.type === 'slideshow' && <Flex direction="column" alignItems="stretch" gap={3}>
          {(Array.isArray(block.data.slides) ? block.data.slides as BlockData[] : []).map((slide, slideIndex, slides) => <Flex key={slideIndex} direction="column" alignItems="stretch" gap={2} borderColor="neutral200" hasRadius padding={3}><Typography fontWeight="bold">Slide {slideIndex + 1}</Typography><AssetPicker label={`${block.id}-slide-${slideIndex}`} value={slide} onChange={(value) => updateSlides(slides.map((entry, entryIndex) => entryIndex === slideIndex ? value : entry))} disabled={disabled} /><TextField blockId={`${block.id}-slide-${slideIndex}-alt`} label="Alt text" value={dataValue(slide, 'alt')} onChange={(value) => updateSlides(slides.map((entry, entryIndex) => entryIndex === slideIndex ? { ...entry, alt: value } : entry))} disabled={disabled} /><TextField blockId={`${block.id}-slide-${slideIndex}-caption`} label="Caption" value={dataValue(slide, 'caption')} onChange={(value) => updateSlides(slides.map((entry, entryIndex) => entryIndex === slideIndex ? { ...entry, caption: value } : entry))} disabled={disabled} /></Flex>)}
          <Button variant="tertiary" size="S" startIcon={<Plus />} onClick={() => updateSlides([...(Array.isArray(block.data.slides) ? block.data.slides as BlockData[] : []), { src: '', alt: '', caption: '' }])} disabled={disabled}>Add slide</Button>
        </Flex>}
        {block.type === 'poll' && <Flex direction="column" alignItems="stretch" gap={3}>
          <TextField blockId={`${block.id}-question`} label="Question" value={dataValue(block.data, 'question')} onChange={(value) => setData('question', value)} multiline disabled={disabled} />
          {(Array.isArray(block.data.options) ? block.data.options as BlockData[] : []).map((option, optionIndex, options) => <TextField key={dataValue(option, 'id') || optionIndex} blockId={`${block.id}-option-${optionIndex}`} label={`Option ${optionIndex + 1}`} value={dataValue(option, 'label')} onChange={(value) => setData('options', options.map((entry, entryIndex) => entryIndex === optionIndex ? { ...entry, label: value } : entry))} disabled={disabled} />)}
          <Button variant="tertiary" size="S" startIcon={<Plus />} onClick={() => setData('options', [...(Array.isArray(block.data.options) ? block.data.options as BlockData[] : []), { id: blockId('option'), label: '' }])} disabled={disabled}>Add option</Button>
        </Flex>}
        {block.type === 'layout' && <Flex direction="column" alignItems="stretch" gap={3}>
          <Flex gap={2} style={{ flexWrap: 'wrap' }}>
            <Button size="S" variant="tertiary" startIcon={<Plus />} onClick={() => setLayoutColumnCount(layoutColumns.length + 1)} disabled={disabled || layoutColumns.length >= 4}>Add column</Button>
            <Button size="S" variant="tertiary" onClick={rebalanceLayoutWidths} disabled={disabled}>Rebalance widths</Button>
            {[2, 3, 4].map((count) => <Button key={count} size="S" variant={layoutColumns.length === count ? 'secondary' : 'tertiary'} aria-pressed={layoutColumns.length === count} onClick={() => setLayoutColumnCount(count)} disabled={disabled}>{count} columns</Button>)}
          </Flex>
          <ColumnsEditor>{layoutColumns.map((column, columnIndex, columns) => {
            const blocks = Array.isArray(column.blocks) ? column.blocks as Block[] : [];
            const updateColumn = (nextBlocks: Block[]) => setData('columns', columns.map((entry, entryIndex) => entryIndex === columnIndex ? { ...entry, blocks: nextBlocks } : entry));
            return (
              <Flex key={columnIndex} direction="column" alignItems="stretch" gap={3} borderColor="neutral200" hasRadius padding={3}>
                <Flex alignItems="flex-end" gap={2}>
                  <TextField blockId={`${block.id}-column-${columnIndex}-width`} label={`Column ${columnIndex + 1}`} value={dataValue(column, 'width') || '1fr'} placeholder="1fr" onChange={(value) => setData('columns', columns.map((entry, entryIndex) => entryIndex === columnIndex ? { ...entry, width: value } : entry))} disabled={disabled} />
                  <Button size="S" variant="tertiary" onClick={() => removeLayoutColumn(columnIndex)} disabled={disabled || columns.length <= 2}>Remove</Button>
                </Flex>
                {blocks.map((child, childIndex) => <BlockCard key={child.id} block={child} index={childIndex} total={blocks.length} nested onChange={(next) => updateColumn(blocks.map((entry) => entry.id === child.id ? next : entry))} onMove={(direction) => { const nextIndex = childIndex + direction; const nextBlocks = [...blocks]; [nextBlocks[childIndex], nextBlocks[nextIndex]] = [nextBlocks[nextIndex], nextBlocks[childIndex]]; updateColumn(nextBlocks); }} onRemove={() => updateColumn(blocks.filter((entry) => entry.id !== child.id))} disabled={disabled} />)}
                <SimpleMenu label={`Add block to column ${columnIndex + 1}`} variant="tertiary" size="S" startIcon={<Plus />} disabled={disabled}>{blockTypes.filter(([type]) => type !== 'layout').map(([type, typeLabel]) => <MenuItem key={type} onSelect={() => updateColumn([...blocks, initialBlock(type)])}>{typeLabel}</MenuItem>)}</SimpleMenu>
              </Flex>
            );
          })}</ColumnsEditor>
        </Flex>}
        <TextField blockId={`${block.id}-spacing`} label="Space below" value={block.mb ?? ''} placeholder="mb-8, mb-[3.25rem], or 24px" onChange={(value) => onChange({ ...block, mb: value.trim() || undefined })} disabled={disabled} />
      </Flex>
    </BlockFrame>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ name, label, labelAction, hint, required, disabled }, ref) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { value, error, onChange } = useField(name);
  const document = asDocument(value);
  const publish = (next: Document) => onChange(name, next);
  const updateBlock = (next: Block) => publish({ ...document, blocks: document.blocks.map((block) => block.id === next.id ? next : block) });
  const moveBlock = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    const blocks = [...document.blocks];
    [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
    publish({ ...document, blocks });
  };

  return (
    <Field.Root name={name} id={name} error={error} hint={hint} required={required}>
      <Flex direction="column" alignItems="stretch" gap={2}>
        <Field.Label action={labelAction}>{label ?? 'Postcard content'}</Field.Label>
        <Workspace $disabled={disabled} $hasError={Boolean(error)}>
          <Flex alignItems="center" borderColor="neutral200" borderWidth="0 0 1px" justifyContent="space-between" padding={4}>
            <Flex direction="column" gap={1}><Typography fontWeight="bold">Postcard content</Typography><Typography variant="omega" textColor="neutral600">{document.blocks.length} blocks</Typography></Flex>
            <Flex gap={2}><Button variant="tertiary" size="S" startIcon={<Eye />} onClick={() => setPreviewOpen(true)}>Preview</Button><SimpleMenu label="Add block" startIcon={<Plus />} disabled={disabled}>{blockTypes.map(([type, typeLabel]) => <MenuItem key={type} onSelect={() => publish({ ...document, blocks: [...document.blocks, initialBlock(type)] })}>{typeLabel}</MenuItem>)}</SimpleMenu></Flex>
          </Flex>
          <WorkspaceGrid>
            <EditorPane>{document.blocks.length === 0 ? <Flex direction="column" gap={3} padding={4} alignItems="flex-start"><Typography textColor="neutral600">Add a block to begin composing.</Typography><SimpleMenu label="Add block" startIcon={<Plus />} disabled={disabled}>{blockTypes.map(([type, typeLabel]) => <MenuItem key={type} onSelect={() => publish({ ...document, blocks: [initialBlock(type)] })}>{typeLabel}</MenuItem>)}</SimpleMenu></Flex> : document.blocks.map((block, index) => <BlockCard key={block.id} block={block} index={index} total={document.blocks.length} onChange={updateBlock} onMove={(direction) => moveBlock(index, direction)} onRemove={() => publish({ ...document, blocks: document.blocks.filter((entry) => entry.id !== block.id) })} disabled={disabled} />)}</EditorPane>
          </WorkspaceGrid>
        </Workspace>
        <Modal.Root open={previewOpen} onOpenChange={setPreviewOpen}>
          <Modal.Content>
            <Modal.Header><Modal.Title>Live preview</Modal.Title></Modal.Header>
            <Modal.Body><Preview document={document} /></Modal.Body>
          </Modal.Content>
        </Modal.Root>
        <Field.Hint />
        <Field.Error />
      </Flex>
      <VisuallyHidden><input ref={ref} aria-hidden="true" name={name} readOnly tabIndex={-1} value="" /></VisuallyHidden>
    </Field.Root>
  );
});
