
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SectionBox from '../components/SectionBox';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api';

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.customerDetail(customerId).then(setData).catch((e) => setError(e.message)); }, [customerId]);

  if (error) return <PageShell title='Customer Detail' desc='Detailed customer view with behaviors, alerts, and messages.'><ErrorState message={error} /></PageShell>;
  if (!data) return <PageShell title='Customer Detail' desc='Detailed customer view with behaviors, alerts, and messages.'><LoadingState /></PageShell>;

  return (
    <PageShell title={data.customer.full_name} desc='Detailed customer view with behaviors, alerts, and generated messages.'>
      <div className='grid lg:grid-cols-3 gap-6'>
        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Profile</h3>
          <div className='space-y-2 text-sm'>
            <p><span className='opacity-60'>Email:</span> {data.customer.email}</p>
            <p><span className='opacity-60'>Company:</span> {data.customer.company}</p>
            <p><span className='opacity-60'>Job title:</span> {data.customer.job_title}</p>
            <p><span className='opacity-60'>Industry:</span> {data.customer.industry}</p>
          </div>
        </SectionBox>
        <SectionBox className='p-6 lg:col-span-2'>
          <div className='flex items-center justify-between gap-3 mb-4'>
            <h3 className='text-xl font-semibold'>Active alerts</h3>
            <Link to='/notifications' className='text-sm text-primary'>Back to notifications</Link>
          </div>
          <div className='space-y-4'>
            {data.alerts.length === 0 && <p className='text-sm opacity-60'>No active high-intent alert.</p>}
            {data.alerts.map((alert) => (
              <div key={`${alert.source}-${alert.behavior_type}`} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'>
                <p className='font-semibold'>{alert.source} / {alert.behavior_type}</p>
                <p className='opacity-60 mt-2'>{alert.similar_behavior_count} similar behaviors · avg score {alert.avg_score}</p>
              </div>
            ))}
          </div>
        </SectionBox>
      </div>

      <div className='grid lg:grid-cols-2 gap-6 mt-10'>
        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Behaviors</h3>
          <div className='space-y-3'>
            {data.behaviors.map((b) => <div key={b.id} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'><p className='font-semibold'>{b.source} / {b.behavior_type}</p><p className='opacity-60 mt-1'>{b.details}</p><p className='mt-1'>Score {b.score}</p></div>)}
          </div>
        </SectionBox>
        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Generated messages</h3>
          <div className='space-y-3'>
            {data.messages.map((m) => <div key={m.id} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'><p className='font-semibold'>{m.subject}</p><p className='opacity-60 mt-1'>{m.campaign_name} · {m.channel}</p><p className='opacity-60 mt-1'>{m.status}</p></div>)}
          </div>
        </SectionBox>
      </div>
    </PageShell>
  );
}
