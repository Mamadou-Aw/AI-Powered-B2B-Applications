import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import SectionBox from '../components/SectionBox';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api';

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [suggestingId, setSuggestingId] = useState('');
  const navigate = useNavigate();

  const load = () => api.notifications().then(setAlerts).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleSuggest = async (alert) => {
    const key = `${alert.customer_id}-${alert.source}-${alert.behavior_type}`;
    try {
      setSuggestingId(key);
      const result = await api.suggestCampaign(alert.customer_id, { source: alert.source, behavior_type: alert.behavior_type });
      setAlerts((current) => current.map((item) => item.customer_id === alert.customer_id && item.source === alert.source && item.behavior_type === alert.behavior_type ? { ...item, suggested_campaign: result.suggested_campaign, ai_reason: result.ai_reason } : item));
      toast.success('AI campaign suggestion updated');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSuggestingId('');
    }
  };

  const handleGenerate = async (alert) => {
    const key = `${alert.customer_id}-${alert.source}-${alert.behavior_type}`;
    try {
      setBusyId(key);
      const message = await api.generateMessage(alert.customer_id, {
        campaign_id: alert.suggested_campaign?.id,
        source: alert.source,
        behavior_type: alert.behavior_type,
      });
      toast.success('AI message draft generated');
      navigate(`/generated-messages/${message.id}/edit`);
    } catch (e) { toast.error(e.message); }
    finally { setBusyId(''); }
  };

  if (error) return <PageShell title='Notifications' desc='High-intent customers based on repeated similar behaviors.'><ErrorState message={error} /></PageShell>;
  if (!alerts) return <PageShell title='Notifications' desc='High-intent customers based on repeated similar behaviors.'><LoadingState /></PageShell>;

  return (
    <PageShell title='Notifications' desc='Customers appear here when they repeat at least 3 similar high-score behaviors.'>
      <div className='space-y-6'>
        {alerts.length === 0 && <SectionBox className='p-8 text-center'>No notifications yet.</SectionBox>}
        {alerts.map((alert) => {
          const key = `${alert.customer_id}-${alert.source}-${alert.behavior_type}`;
          return (
          <SectionBox key={key} className='p-6'>
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 flex-wrap'>
                  <h3 className='text-xl font-semibold'>{alert.full_name}</h3>
                  <span className='text-xs border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1'>Avg score {alert.avg_score}</span>
                  <span className='text-xs border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1'>{alert.similar_behavior_count} similar behaviors</span>
                </div>
                <p className='mt-2 text-sm opacity-70'>{alert.company} · {alert.email}</p>
                <p className='mt-3 text-sm'>Pattern: <span className='text-primary'>{alert.source}</span> / <span className='text-primary'>{alert.behavior_type}</span></p>
                <div className='grid md:grid-cols-3 gap-4 mt-5'>
                  {alert.behaviors.map((behavior) => (
                    <div key={behavior.id} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'>
                      <p className='font-semibold'>Score {behavior.score}</p>
                      <p className='mt-2 opacity-70'>{behavior.details}</p>
                    </div>
                  ))}
                </div>
                {alert.suggested_campaign && (
                  <div className='mt-5 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'>
                    <p className='font-semibold'>Suggested campaign</p>
                    <p className='mt-2'>{alert.suggested_campaign.name}</p>
                    <p className='opacity-60 mt-1'>{alert.suggested_campaign.channel}</p>
                    <p className='opacity-60 mt-1'>{alert.suggested_campaign.goal}</p>
                    {alert.ai_reason && <p className='text-primary mt-3'>{alert.ai_reason}</p>}
                  </div>
                )}
              </div>

              <div className='flex flex-col gap-3 min-w-52'>
                <Link to={`/customers/${alert.customer_id}`} className='text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-full'>Open customer</Link>
                <button onClick={() => handleSuggest(alert)} disabled={suggestingId === key} className='text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-full disabled:opacity-50'>
                  {suggestingId === key ? 'Analyzing...' : 'Analyze campaign fit'}
                </button>
                <button onClick={() => handleGenerate(alert)} disabled={busyId === key} className='bg-primary text-white px-6 py-3 rounded-full disabled:opacity-50'>
                  {busyId === key ? 'Generating...' : 'Generate AI Message'}
                </button>
              </div>
            </div>
          </SectionBox>
        )})}
      </div>
    </PageShell>
  );
}
