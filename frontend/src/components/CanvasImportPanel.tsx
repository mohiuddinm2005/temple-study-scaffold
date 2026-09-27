import { useState, type FormEvent } from 'react';
import { apiFetch } from '../api/client';
import type { EventResponse } from '../types';

export default function CanvasImportPanel({
  events,
  onSynced,
}: {
  events: EventResponse | null;
  onSynced: (message: string) => void;
}) {
  const [feedUrl, setFeedUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function sync(event?: FormEvent<HTMLFormElement>, refresh = false) {
    event?.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch('/api/canvas/import', {
        method: 'POST',
        body: JSON.stringify(refresh ? {} : { feedUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Canvas sync failed');
      setFeedUrl('');
      onSynced(`Synced ${result.importedCount} calendar events.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Canvas sync failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Canvas calendar</h2>
          <p>
            {events?.lastSyncedAt
              ? `Last synced ${new Date(events.lastSyncedAt).toLocaleString()}`
              : 'Not connected yet'}
          </p>
        </div>
      </div>
      <form onSubmit={sync}>
        <label>
          Temple Canvas iCal feed URL
          <input
            type="url"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="https://templeu.instructure.com/feeds/calendars/user_….ics"
            required
            autoComplete="off"
          />
        </label>
        <button disabled={busy}>{events?.hasCanvasFeed ? 'Replace feed' : 'Import feed'}</button>
      </form>
      {events?.hasCanvasFeed && (
        <button type="button" className="secondary" disabled={busy} onClick={() => sync(undefined, true)}>
          Refresh saved feed
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}