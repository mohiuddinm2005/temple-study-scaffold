import { useState, type FormEvent } from 'react';
import { apiJson } from '../api/client';

type ScenarioResult = {
  requiredAverage: number | null;
  status: 'achieved' | 'possible' | 'unreachable';
  finalGrade?: number;
};

export default function GradeScenario() {
  const [target, setTarget] = useState(90);
  const [earnedPoints, setEarnedPoints] = useState(60);
  const [remainingWeight, setRemainingWeight] = useState(30);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await apiJson<ScenarioResult>('/api/grades/scenario', {
        method: 'POST',
        body: JSON.stringify({ target, earnedPoints, remainingWeight }),
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Could not calculate that scenario');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Grade scenario calculator</h2>
          <p>Enter your target grade and what you've earned so far</p>
        </div>
      </div>
      <form onSubmit={submit}>
        <label>
          Target grade (0-100)
          <input type="number" min={0} max={100} value={target} onChange={(e) => setTarget(Number(e.target.value))} required />
        </label>
        <label>
          Points earned so far (0-100)
          <input
            type="number"
            min={0}
            max={100}
            value={earnedPoints}
            onChange={(e) => setEarnedPoints(Number(e.target.value))}
            required
          />
        </label>
        <label>
          Remaining weight (0-100)
          <input
            type="number"
            min={0}
            max={100}
            value={remainingWeight}
            onChange={(e) => setRemainingWeight(Number(e.target.value))}
            required
          />
        </label>
        <button disabled={busy}>{busy ? 'Calculating…' : 'Calculate'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Target</th>
                <th>Required average on the rest</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{target}</td>
                <td>{result.requiredAverage === null ? '—' : `${result.requiredAverage.toFixed(1)}%`}</td>
                <td>
                  <span className={`status ${result.status}`}>
                    {result.status === 'achieved' ? 'Already achieved' : result.status === 'possible' ? 'Possible' : 'Not reachable'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}