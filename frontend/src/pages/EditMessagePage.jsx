import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import SectionBox from '../components/SectionBox';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api';

const FieldError = ({ message }) => message ? <p className='text-xs text-red-500 mt-1'>{message}</p> : null;

export default function EditMessagePage() {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { api.message(messageId).then(setMessage).catch((e) => setError(e.message)); }, [messageId]);

  const validate = () => {
    const next = {};
    if ((message.subject || '').trim().length < 3) next.subject = 'Subject must be at least 3 characters.';
    if ((message.message_body || '').trim().length < 20) next.message_body = 'Message body must be at least 20 characters.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      setFieldErrors({});
      await api.updateMessage(messageId, { subject: message.subject, message_body: message.message_body, ai_reason: message.ai_reason, status: message.status || 'draft' });
      toast.success('Message updated');
      navigate('/generated-messages');
    } catch (e) {
      setFieldErrors(e.details || {});
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const send = async () => {
    if (!validate()) return;
    try {
      setSending(true);
      setFieldErrors({});
      await api.updateMessage(messageId, { subject: message.subject, message_body: message.message_body, ai_reason: message.ai_reason, status: message.status || 'draft' });
      const result = await api.sendMessage(messageId);
      toast.success(result.message || 'Email sent');
      navigate('/generated-messages');
    } catch (e) {
      setFieldErrors(e.details || {});
      toast.error(e.message);
    } finally { setSending(false); }
  };

  if (error) return <PageShell title='Edit Message' desc='Review and update the generated message before sending.'><ErrorState message={error} /></PageShell>;
  if (!message) return <PageShell title='Edit Message' desc='Review and update the generated message before sending.'><LoadingState /></PageShell>;

  return (
    <PageShell title='Edit Message' desc='Review and update the generated message before sending.'>
      <SectionBox className='p-6'>
        <form onSubmit={save} className='space-y-4' noValidate>
          <div>
            <p className='mb-2 text-sm font-medium'>Subject</p>
            <input value={message.subject} onChange={(e) => setMessage({ ...message, subject: e.target.value })} className='w-full p-3 text-sm outline-none rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent' />
            <FieldError message={fieldErrors.subject} />
          </div>
          <div>
            <p className='mb-2 text-sm font-medium'>Message body</p>
            <textarea rows={12} value={message.message_body} onChange={(e) => setMessage({ ...message, message_body: e.target.value })} className='w-full p-3 text-sm outline-none rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent' />
            <FieldError message={fieldErrors.message_body} />
          </div>
          <div>
            <p className='mb-2 text-sm font-medium'>AI reason</p>
            <textarea rows={4} value={message.ai_reason || ''} onChange={(e) => setMessage({ ...message, ai_reason: e.target.value })} className='w-full p-3 text-sm outline-none rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent' />
          </div>
          <div className='flex gap-3 flex-wrap'>
            <button type='submit' disabled={saving} className='bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-full disabled:opacity-50'>{saving ? 'Saving...' : 'Save changes'}</button>
            <button type='button' onClick={send} disabled={sending || message.channel?.toLowerCase() !== 'email'} className='bg-primary text-white px-6 py-3 rounded-full disabled:opacity-50'>{sending ? 'Sending...' : 'Send email'}</button>
          </div>
        </form>
      </SectionBox>
    </PageShell>
  );
}
