import { Box, Flex, IconButton, Typography } from '@strapi/design-system';
import { ArrowLeft, ArrowRight, Eye, Image as ImageIcon } from '@strapi/icons';
import { useState } from 'react';
import { styled } from 'styled-components';

import type { Block, BlockData, Document } from './types';

function bottomMargin(block: Block, isLast: boolean) {
  const value = block.mb?.trim();
  if (!value || /[;{}]/.test(value)) return isLast ? '0px' : '17.6px';
  const utility = value.match(/^(-?)mb-(\d+(?:\.\d+)?)$/);
  // Match rwm-front's 0.22rem spacing and 16px root inside Strapi's 10px root.
  if (utility) return `${(utility[1] ? -1 : 1) * Number(utility[2]) * 3.52}px`;
  if (value === 'mb-px') return '1px';
  if (value === 'mb-auto') return 'auto';
  const css = value.match(/^mb-\[(.+)\]$/)?.[1].replace(/_/g, ' ') ?? value;
  return css.replace(/(-?(?:\d*\.)?\d+)rem\b/g, (_, amount) => `${Number(amount) * 16}px`)
    .replace(/var\(--spacing\)/g, '3.52px');
}

const PreviewPane = styled(Box)`
  align-self: start;
`;

const ArticleSheet = styled(Box)`
  min-height: 280px;
`;

const Header = styled.h3<{ $size: string }>`
  font-size: ${({ $size }) => $size === 'sm' ? '1rem' : $size === 'lg' ? '1.45rem' : '1.18rem'};
  font-weight: 600;
  line-height: ${({ $size }) => $size === 'sm' ? 1.5 : $size === 'lg' ? 1.2 : 1.25};
  margin: 0;
`;

const Standfirst = styled.p<{ $size: string }>`
  font-size: ${({ $size }) => $size === 'sm' ? '0.75rem' : $size === 'lg' ? '0.9rem' : '0.95rem'};
  line-height: ${({ $size }) => $size === 'sm' ? 1 : $size === 'lg' ? 1.25 : 1.5};
  margin: 0;
  max-width: 48rem;
`;

const Paragraph = styled.p`
  font-size: 1rem;
  line-height: 1.75;
  margin: 0;
`;

const SmallText = styled.p`
  border: 1px dashed ${({ theme }) => theme.colors.neutral300};
  border-radius: ${({ theme }) => theme.borderRadius};
  margin: 0;
  padding: ${({ theme }) => `${theme.spaces[3]} ${theme.spaces[4]}`};
`;

const Quote = styled.blockquote`
  background: ${({ theme }) => theme.colors.neutral100};
  border: 1px solid ${({ theme }) => theme.colors.primary200};
  border-radius: ${({ theme }) => theme.borderRadius};
  margin: 0;
  padding: ${({ theme }) => `${theme.spaces[4]} ${theme.spaces[5]}`};
`;

const MediaFrame = styled.figure<{ $withBackground: boolean }>`
  background: ${({ theme, $withBackground }) => $withBackground ? theme.colors.neutral150 : theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  margin: 0;
  overflow: hidden;
  padding: ${({ theme, $withBackground }) => $withBackground ? theme.spaces[4] : 0};
  position: relative;
`;

const MediaImage = styled.img<{ $withBackground: boolean; $withBorder: boolean }>`
  border: ${({ theme, $withBorder }) => $withBorder ? `1px solid ${theme.colors.neutral200}` : 0};
  border-radius: ${({ theme }) => theme.borderRadius};
  display: block;
  height: ${({ $withBackground }) => $withBackground ? '22rem' : '24rem'};
  margin: ${({ $withBackground }) => $withBackground ? '0 auto' : 0};
  max-width: ${({ $withBackground }) => $withBackground ? '78%' : 'none'};
  object-fit: cover;
  width: 100%;
`;

const MediaCaption = styled.figcaption`
  background: ${({ theme }) => theme.colors.neutral800};
  bottom: 0;
  color: ${({ theme }) => theme.colors.neutral0};
  left: 0;
  padding: ${({ theme }) => `${theme.spaces[5]} ${theme.spaces[5]} ${theme.spaces[4]}`};
  position: absolute;
  right: 0;
`;

const EmbedShell = styled(Box)`
  box-shadow: ${({ theme }) => theme.shadows.filterShadow};
`;

const EmbedPlaceholder = styled(Flex)<{ $kind: string }>`
  height: ${({ $kind }) => $kind === 'spotify' ? '152px' : $kind === 'map' ? '22rem' : '24rem'};
`;

const LayoutGrid = styled.div<{ $template: string }>`
  display: grid;
  gap: ${({ theme }) => theme.spaces[5]};
  grid-template-columns: 1fr;

  ${({ theme }) => theme.breakpoints.medium} {
    grid-template-columns: ${({ $template }) => $template};
  }
`;

function value(data: BlockData, key: string): string {
  const entry = data[key];
  return typeof entry === 'string' ? entry : '';
}

function layoutTemplate(data: BlockData) {
  const columns = Array.isArray(data.columns) ? data.columns as BlockData[] : [];
  const style = value(data, 'style') || 'two-column';

  if (style === 'three-column') return 'repeat(3, minmax(0, 1fr))';
  if (style === 'sidebar-left') return 'minmax(10rem, .7fr) minmax(0, 1.3fr)';
  if (style === 'sidebar-right') return 'minmax(0, 1.3fr) minmax(10rem, .7fr)';

  return columns.map((column) => {
    const width = value(column, 'width');
    return width === '2fr' || width === '3fr' ? width : '1fr';
  }).join(' ') || 'repeat(2, minmax(0, 1fr))';
}

function Media({ src, alt, caption, withBackground = false, withBorder = false }: { src: string; alt: string; caption: string; withBackground?: boolean; withBorder?: boolean }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <MediaFrame $withBackground={withBackground}>
        <Flex alignItems="center" justifyContent="center" background="neutral150" height="240px">
          <Flex direction="column" alignItems="center" gap={2}>
            <ImageIcon aria-hidden />
            <Typography variant="omega" textColor="neutral600">Media will appear here</Typography>
          </Flex>
        </Flex>
      </MediaFrame>
    );
  }

  return (
    <MediaFrame $withBackground={withBackground}>
      <MediaImage src={src} alt={alt || caption || 'Postcard feature image'} $withBackground={withBackground} $withBorder={withBorder} onError={() => setHasError(true)} />
      {caption && <MediaCaption><Typography variant="omega">{caption}</Typography></MediaCaption>}
    </MediaFrame>
  );
}

function PreviewBlock({ block }: { block: Block }) {
  const data = block.data;
  const text = value(data, 'text');

  switch (block.type) {
    case 'header':
      return <Header $size={value(data, 'fontSize') || 'md'}>{text || 'Heading'}</Header>;
    case 'subtext':
      return <Standfirst $size={value(data, 'fontSize') || 'md'}><Typography textColor="neutral600">{text || 'Standfirst'}</Typography></Standfirst>;
    case 'paragraph':
      return <Paragraph>{text || 'Start writing this block.'}</Paragraph>;
    case 'smallText':
      return <SmallText><Typography variant="omega" textColor="neutral600">{text || 'Small supporting text.'}</Typography></SmallText>;
    case 'image':
      return <Media key={value(data, 'src')} src={value(data, 'src')} alt={value(data, 'alt')} caption={value(data, 'caption')} withBackground={data.withBackground === true} withBorder={data.withBorder === true} />;
    case 'quote':
      return <Quote><Typography fontWeight="bold">“{text || 'Quote'}”</Typography>{value(data, 'attribution') && <Typography variant="omega" textColor="neutral600" style={{ marginTop: '0.75rem' }}>{value(data, 'attribution')}</Typography>}</Quote>;
    case 'embed': {
      const kind = value(data, 'kind') || 'youtube';
      return <EmbedShell background="neutral0" borderColor="neutral200" hasRadius padding={4}><Flex direction="column" gap={3}><Flex alignItems="center" justifyContent="space-between"><Typography variant="omega" fontWeight="bold">{kind} embed</Typography><Typography variant="omega" textColor="primary600">{kind === 'spotify' ? 'Open in Spotify' : kind === 'youtube' ? 'Watch on YouTube' : ''}</Typography></Flex><EmbedPlaceholder $kind={kind} alignItems="center" justifyContent="center" background="neutral150" borderColor="neutral200" hasRadius><Typography textColor="neutral600">{value(data, 'url') || `${kind} embed URL`}</Typography></EmbedPlaceholder>{value(data, 'caption') && <Typography variant="omega" textColor="neutral600">{value(data, 'caption')}</Typography>}</Flex></EmbedShell>;
    }
    case 'slideshow':
      return <Slideshow block={block} />;
    case 'poll': {
      const options = Array.isArray(data.options) ? data.options as BlockData[] : [];
      return <Box background="neutral100" borderColor="neutral200" borderStyle="dashed" hasRadius padding={4}><Flex direction="column" gap={3}><Flex alignItems="center" justifyContent="space-between"><Typography fontWeight="bold">Poll placeholder</Typography><Typography variant="omega" textColor="neutral600">Preview only</Typography></Flex><Paragraph>{value(data, 'question') || 'Poll question'}</Paragraph><Flex direction="column" gap={3}>{options.map((option, index) => <Box key={value(option, 'id') || index} background="neutral0" borderColor="neutral200" hasRadius padding={3}><Typography variant="omega">{value(option, 'label') || `Option ${index + 1}`}</Typography></Box>)}</Flex><Typography variant="omega" textColor="neutral600">This preview does not submit poll responses.</Typography></Flex></Box>;
    }
    case 'layout': {
      const columns = Array.isArray(data.columns) ? data.columns as BlockData[] : [];
      return <LayoutGrid $template={layoutTemplate(data)}>{columns.map((column, index) => { const blocks = Array.isArray(column.blocks) ? column.blocks as Block[] : []; return <Flex key={index} direction="column" minWidth={0}>{blocks.map((child, childIndex) => <Box key={child.id} style={{ marginBottom: bottomMargin(child, childIndex === blocks.length - 1) }}><PreviewBlock block={child} /></Box>)}</Flex>; })}</LayoutGrid>;
    }
    default:
      return <Typography textColor="neutral600">Unsupported block</Typography>;
  }
}

function Slideshow({ block }: { block: Block }) {
  const slides = Array.isArray(block.data.slides) ? block.data.slides as BlockData[] : [];
  const [slideIndex, setSlideIndex] = useState(0);
  const currentIndex = Math.min(slideIndex, Math.max(slides.length - 1, 0));
  const current = slides[currentIndex] ?? {};
  const count = slides.length || 1;

  return (
    <EmbedShell background="neutral0" borderColor="neutral200" hasRadius padding={4}>
      <Flex direction="column" gap={3}>
        <Flex alignItems="center" justifyContent="space-between"><Typography variant="omega" fontWeight="bold">Slideshow</Typography><Typography variant="omega" textColor="neutral600">Slide {currentIndex + 1} of {count}</Typography></Flex>
        <Box position="relative"><Media key={value(current, 'src')} src={value(current, 'src')} alt={value(current, 'alt')} caption={value(current, 'caption')} /><IconButton label="Previous slide" size="S" onClick={() => setSlideIndex((index) => index === 0 ? count - 1 : index - 1)} disabled={slides.length < 2} position="absolute" left="12px" top="50%"><ArrowLeft /></IconButton><IconButton label="Next slide" size="S" onClick={() => setSlideIndex((index) => (index + 1) % count)} disabled={slides.length < 2} position="absolute" right="12px" top="50%"><ArrowRight /></IconButton></Box>
      </Flex>
    </EmbedShell>
  );
}

export function Preview({ document }: { document: Document }) {
  return (
    <PreviewPane background="neutral100" hasRadius padding={4} aria-label="Postcard live preview">
      <Flex alignItems="center" gap={2} paddingBottom={3}>
        <Eye aria-hidden />
        <Typography fontWeight="bold">Live preview</Typography>
      </Flex>
      <ArticleSheet background="neutral0" hasRadius padding={4}>
        {document.blocks.map((block, index) => <Box key={block.id} style={{ marginBottom: bottomMargin(block, index === document.blocks.length - 1) }}><PreviewBlock block={block} /></Box>)}
      </ArticleSheet>
    </PreviewPane>
  );
}
