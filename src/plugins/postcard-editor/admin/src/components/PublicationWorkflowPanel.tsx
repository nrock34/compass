import { Button, Field, Flex, Typography } from '@strapi/design-system';
import { Calendar, Check, Eye, Plus } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { useState } from 'react';

const editorialModels: Record<string, true> = {
  'api::article.article': true,
  'api::post.post': true,
  'api::resource.resource': true,
  'api::update.update': true,
  'api::tip.tip': true,
  'api::guide.guide': true,
  'api::itinerary.itinerary': true,
  'api::academic-resource.academic-resource': true,
  'api::cultural-resource.cultural-resource': true,
  'api::editorial-asset.editorial-asset': true,
};

const transitions: Record<string, readonly string[]> = {
  draft: ['review', 'scheduled', 'published'],
  review: ['draft', 'scheduled', 'published'],
  scheduled: ['draft', 'published'],
  published: ['archived'],
  archived: ['draft', 'review', 'published'],
};

const labels: Record<string, string> = {
  draft: 'Draft',
  review: 'Ready for review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

type PublicationPanelProps = {
  model: string;
  documentId?: string;
  document?: unknown;
};

function publicationStatus(document: unknown): string {
  if (document && typeof document === 'object' && 'publication_status' in document && typeof document.publication_status === 'string' && document.publication_status in transitions) {
    return document.publication_status;
  }

  return 'draft';
}

function statusIcon(status: string) {
  if (status === 'review') return <Eye aria-hidden />;
  if (status === 'scheduled') return <Calendar aria-hidden />;
  if (status === 'published') return <Check aria-hidden />;
  return <Plus aria-hidden />;
}

function requestMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data && error.response.data.error && typeof error.response.data.error === 'object' && 'message' in error.response.data.error && typeof error.response.data.error.message === 'string') {
    return error.response.data.error.message;
  }

  return error instanceof Error && error.message ? error.message : 'The publication status could not be changed.';
}

export function PublicationWorkflowPanel({ model, documentId, document }: PublicationPanelProps) {
  const supported = Boolean(editorialModels[model]);
  const current = publicationStatus(document);
  const choices = transitions[current];
  const [next, setNext] = useState(choices[0] ?? '');
  const [scheduledFor, setScheduledFor] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const { post } = useFetchClient();
  const selected = choices.includes(next) ? next : choices[0] ?? '';

  const transition = async () => {
    if (!selected) return;
    if (selected === 'scheduled' && !scheduledFor) {
      setMessage('Choose a future date and time before scheduling.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      await post('/postcard-editor/editorial-publications/transition', {
        uid: model,
        documentId,
        status: selected,
        scheduledFor: selected === 'scheduled' ? new Date(scheduledFor).toISOString() : undefined,
      });
      window.location.reload();
    } catch (error) {
      setMessage(requestMessage(error));
    } finally {
      setSubmitting(false);
      setConfirmArchive(false);
    }
  };

  if (!supported) return null;

  if (!documentId || !document) {
    return {
      title: 'Publication',
      content: (
        <Flex direction="column" alignItems="stretch" gap={3} width="100%">
          <Typography textColor="neutral600" variant="omega">
            Save this entry from the Entry panel. It will be created as a draft, then publication actions will appear here.
          </Typography>
        </Flex>
      ),
    };
  }

  return {
    title: 'Publication',
    content: <Flex direction="column" alignItems="stretch" gap={3} width="100%">
      <Flex direction="column" gap={1}><Typography variant="omega" textColor="neutral600">Current status</Typography><Typography fontWeight="bold">{labels[current]}</Typography></Flex>
      <>
        {choices.length > 1 && <Flex direction="column" alignItems="stretch" gap={2}>
          <Typography variant="omega" fontWeight="bold">Move to</Typography>
          {choices.map((status) => (
            <Button
              key={status}
              variant={selected === status ? 'secondary' : 'tertiary'}
              aria-pressed={selected === status}
              onClick={() => {
                setNext(status);
                setMessage('');
              }}
              disabled={submitting}
            >
              {labels[status]}
            </Button>
          ))}
        </Flex>}
        {selected === 'scheduled' && <Field.Root name="publication-scheduled-for" required><Field.Label>Publish date and time</Field.Label><Field.Input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} disabled={submitting} /></Field.Root>}
        {selected === 'archived' ? (
          confirmArchive ? (
            <Flex direction="column" alignItems="stretch" gap={2}>
              <Typography variant="omega" textColor="danger600">This removes the entry from publication. You can restore it later.</Typography>
              <Flex gap={2}>
                <Button variant="danger" onClick={() => void transition()} disabled={submitting}>Confirm archive</Button>
                <Button variant="tertiary" onClick={() => setConfirmArchive(false)} disabled={submitting}>Cancel</Button>
              </Flex>
            </Flex>
          ) : (
            <Button variant="danger-light" startIcon={statusIcon(selected)} onClick={() => setConfirmArchive(true)} disabled={submitting}>Archive entry</Button>
          )
        ) : <Button startIcon={statusIcon(selected)} onClick={() => void transition()} disabled={submitting}>{submitting ? 'Updating…' : selected === 'review' ? 'Send for review' : selected === 'scheduled' ? 'Schedule publication' : selected === 'published' ? 'Publish now' : 'Return to draft'}</Button>}
      </>
      {message && <Typography variant="omega" textColor="danger600" role="status">{message}</Typography>}
    </Flex>,
  };
}
