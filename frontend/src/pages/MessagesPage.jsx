import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import SectionBox from '../components/SectionBox';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api';

export default function MessagesPage() {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState(null);

  const load = () => {
    setError('');
    return api.messages().then(setMessages).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const send = async (id) => {
    try {
      setSendingId(id);
      const result = await api.sendMessage(id);
      toast.success(result.message || 'Email sent');
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSendingId(null); }
  };

  if (error) return <PageShell title='Generated Messages' desc='Review, edit, and send AI-generated messages.'><ErrorState message={error} /></PageShell>;
  if (!messages) return <PageShell title='Generated Messages' desc='Review, edit, and send AI-generated messages.'><LoadingState /></PageShell>;

  return (
    <PageShell title='Generated Messages' desc='Review, edit, and send AI-generated messages linked to their campaigns.'>
      <div className='space-y-6'>
        {messages.length === 0 && <SectionBox className='p-8 text-center'>No generated messages yet.</SectionBox>}
        {messages.map((message) => (
          <SectionBox key={message.id} className='p-6'>
            <div className='flex flex-col lg:flex-row gap-6 lg:items-start lg:justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 flex-wrap'>
                  <h3 className='text-xl font-semibold'>{message.subject}</h3>
                  <span className='text-xs border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1'>{message.status}</span>
                </div>
                <p className='mt-2 text-sm opacity-70'>{message.full_name} · {message.email} · {message.campaign_name} · {message.channel}</p>
                <p className='mt-4 text-sm whitespace-pre-line opacity-80'>{message.message_body}</p>
                {message.ai_reason && <p className='mt-4 text-sm text-primary'>{message.ai_reason}</p>}
              </div>
              <div className='flex flex-col gap-3 min-w-48'>
                <Link to={`/generated-messages/${message.id}/edit`} className='text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-full'>Edit message</Link>
                <button onClick={() => send(message.id)} disabled={sendingId === message.id || message.channel?.toLowerCase() !== 'email'} className='bg-primary text-white px-6 py-3 rounded-full disabled:opacity-50'>
                  {sendingId === message.id ? 'Sending...' : 'Send email'}
                </button>
              </div>
            </div>
          </SectionBox>
        ))}
      </div>
    </PageShell>
  );
}
