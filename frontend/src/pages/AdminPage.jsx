import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import SectionBox from '../components/SectionBox';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api';

const initialCustomer = { full_name: '', email: '', company: '', job_title: '', industry: '' };
const initialCampaign = { name: '', goal: '', channel: 'Email' };
const initialBehavior = { customer_id: '', source: 'website', behavior_type: 'page_view', details: '', score: 80 };

const Input = ({ error, ...props }) => <input {...props} className='w-full p-3 text-sm outline-none rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent' />;
const Select = ({ error, ...props }) => <select {...props} className='w-full p-3 text-sm outline-none rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent' />;
const Textarea = ({ error, ...props }) => <textarea {...props} className='w-full p-3 text-sm outline-none rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent' />;
const FieldError = ({ message }) => message ? <p className='text-xs text-red-500 mt-1'>{message}</p> : null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminPage() {
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerForm, setCustomerForm] = useState(initialCustomer);
  const [campaignForm, setCampaignForm] = useState(initialCampaign);
  const [behaviorForm, setBehaviorForm] = useState(initialBehavior);
  const [customerErrors, setCustomerErrors] = useState({});
  const [campaignErrors, setCampaignErrors] = useState({});
  const [behaviorErrors, setBehaviorErrors] = useState({});
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [savingBehavior, setSavingBehavior] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [c1, c2, c3] = await Promise.all([api.customers(), api.campaigns(), api.behaviors()]);
      setCustomers(c1);
      setCampaigns(c2);
      setBehaviors(c3);
      if (!behaviorForm.customer_id && c1[0]) setBehaviorForm((f) => ({ ...f, customer_id: String(c1[0].id) }));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validateCustomer = () => {
    const next = {};
    if ((customerForm.full_name || '').trim().length < 2) next.full_name = 'Enter a valid full name.';
    if (!emailRegex.test((customerForm.email || '').trim())) next.email = 'Enter a valid email address.';
    setCustomerErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateCampaign = () => {
    const next = {};
    if ((campaignForm.name || '').trim().length < 3) next.name = 'Campaign name must be at least 3 characters.';
    if ((campaignForm.goal || '').trim().length < 10) next.goal = 'Goal must be at least 10 characters.';
    if (!campaignForm.channel) next.channel = 'Choose a channel.';
    setCampaignErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateBehavior = () => {
    const next = {};
    const score = Number(behaviorForm.score);
    if (!behaviorForm.customer_id) next.customer_id = 'Choose a customer.';
    if ((behaviorForm.details || '').trim().length < 5) next.details = 'Details must be at least 5 characters.';
    if (Number.isNaN(score) || score < 0 || score > 100) next.score = 'Score must be between 0 and 100.';
    setBehaviorErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyServerErrors = (setter, err) => setter(err?.details || {});

  const submitCustomer = async (e) => {
    e.preventDefault();
    if (!validateCustomer()) return;
    try {
      setSavingCustomer(true);
      setCustomerErrors({});
      await api.createCustomer(customerForm);
      toast.success('Customer added');
      setCustomerForm(initialCustomer);
      load();
    } catch (e) {
      applyServerErrors(setCustomerErrors, e);
      toast.error(e.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  const submitCampaign = async (e) => {
    e.preventDefault();
    if (!validateCampaign()) return;
    try {
      setSavingCampaign(true);
      setCampaignErrors({});
      await api.createCampaign(campaignForm);
      toast.success('Campaign added');
      setCampaignForm(initialCampaign);
      load();
    } catch (e) {
      applyServerErrors(setCampaignErrors, e);
      toast.error(e.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const submitBehavior = async (e) => {
    e.preventDefault();
    if (!validateBehavior()) return;
    try {
      setSavingBehavior(true);
      setBehaviorErrors({});
      const res = await api.createBehavior({ ...behaviorForm, customer_id: Number(behaviorForm.customer_id), score: Number(behaviorForm.score) });
      toast.success(res.triggered_notification ? 'Behavior added — notification triggered.' : 'Behavior added');
      setBehaviorForm((f) => ({ ...initialBehavior, customer_id: f.customer_id || '' }));
      load();
    } catch (e) {
      applyServerErrors(setBehaviorErrors, e);
      toast.error(e.message);
    } finally {
      setSavingBehavior(false);
    }
  };

  if (loading) return <PageShell title='Admin' desc='Manage customers, campaigns, and behaviors.'><LoadingState /></PageShell>;
  if (error) return <PageShell title='Admin' desc='Manage customers, campaigns, and behaviors.'><ErrorState message={error} /></PageShell>;

  return (
    <PageShell title='Admin' desc='Add and consult campaigns, customers, and customer behaviors.'>
      <div className='grid xl:grid-cols-3 gap-6'>
        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Add customer</h3>
          <form onSubmit={submitCustomer} className='space-y-3' noValidate>
            <div>
              <Input placeholder='Full name' value={customerForm.full_name} onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })} />
              <FieldError message={customerErrors.full_name} />
            </div>
            <div>
              <Input type='email' placeholder='Email' value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
              <FieldError message={customerErrors.email} />
            </div>
            <div>
              <Input placeholder='Company' value={customerForm.company} onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })} />
              <FieldError message={customerErrors.company} />
            </div>
            <Input placeholder='Job title' value={customerForm.job_title} onChange={(e) => setCustomerForm({ ...customerForm, job_title: e.target.value })} />
            <Input placeholder='Industry' value={customerForm.industry} onChange={(e) => setCustomerForm({ ...customerForm, industry: e.target.value })} />
            <button disabled={savingCustomer} className='bg-primary text-white px-6 py-3 rounded-full disabled:opacity-50'>{savingCustomer ? 'Saving...' : 'Save customer'}</button>
          </form>
        </SectionBox>

        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Add campaign</h3>
          <form onSubmit={submitCampaign} className='space-y-3' noValidate>
            <div>
              <Input placeholder='Campaign name' value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
              <FieldError message={campaignErrors.name} />
            </div>
            <div>
              <Textarea rows={4} placeholder='Goal' value={campaignForm.goal} onChange={(e) => setCampaignForm({ ...campaignForm, goal: e.target.value })} />
              <FieldError message={campaignErrors.goal} />
            </div>
            <div>
              <Select value={campaignForm.channel} onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}>
                <option>Email</option>
                <option>LinkedIn</option>
                <option>SMS</option>
              </Select>
              <FieldError message={campaignErrors.channel} />
            </div>
            <button disabled={savingCampaign} className='bg-primary text-white px-6 py-3 rounded-full disabled:opacity-50'>{savingCampaign ? 'Saving...' : 'Save campaign'}</button>
          </form>
        </SectionBox>

        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Add behavior</h3>
          <form onSubmit={submitBehavior} className='space-y-3' noValidate>
            <div>
              <Select value={behaviorForm.customer_id} onChange={(e) => setBehaviorForm({ ...behaviorForm, customer_id: e.target.value })}>
                <option value=''>Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </Select>
              <FieldError message={behaviorErrors.customer_id} />
            </div>
            <div>
              <Select value={behaviorForm.source} onChange={(e) => setBehaviorForm({ ...behaviorForm, source: e.target.value })}>
                <option>website</option>
                <option>social_media</option>
                <option>google_search</option>
              </Select>
              <FieldError message={behaviorErrors.source} />
            </div>
            <div>
              <Select value={behaviorForm.behavior_type} onChange={(e) => setBehaviorForm({ ...behaviorForm, behavior_type: e.target.value })}>
                <option>page_view</option>
                <option>download</option>
                <option>like</option>
                <option>search_interest</option>
              </Select>
              <FieldError message={behaviorErrors.behavior_type} />
            </div>
            <div>
              <Textarea rows={4} placeholder='Details' value={behaviorForm.details} onChange={(e) => setBehaviorForm({ ...behaviorForm, details: e.target.value })} />
              <FieldError message={behaviorErrors.details} />
            </div>
            <div>
              <Input type='number' min='0' max='100' placeholder='Score' value={behaviorForm.score} onChange={(e) => setBehaviorForm({ ...behaviorForm, score: e.target.value })} />
              <FieldError message={behaviorErrors.score} />
            </div>
            <button disabled={savingBehavior} className='bg-primary text-white px-6 py-3 rounded-full disabled:opacity-50'>{savingBehavior ? 'Saving...' : 'Save behavior'}</button>
          </form>
        </SectionBox>
      </div>

      <div className='grid lg:grid-cols-3 gap-6 mt-10'>
        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Customers</h3>
          <div className='space-y-3 max-h-[28rem] overflow-auto'>
            {customers.length === 0 ? <p className='text-sm opacity-60'>No customers yet.</p> : customers.map((c) => <div key={c.id} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'><p className='font-semibold'>{c.full_name}</p><p className='opacity-60 mt-1'>{c.email}</p><p className='opacity-60'>{c.company}</p></div>)}
          </div>
        </SectionBox>
        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Campaigns</h3>
          <div className='space-y-3 max-h-[28rem] overflow-auto'>
            {campaigns.length === 0 ? <p className='text-sm opacity-60'>No campaigns yet.</p> : campaigns.map((c) => <div key={c.id} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'><p className='font-semibold'>{c.name}</p><p className='opacity-60 mt-1'>{c.channel}</p><p className='opacity-60'>{c.goal}</p></div>)}
          </div>
        </SectionBox>
        <SectionBox className='p-6'>
          <h3 className='text-xl font-semibold mb-4'>Behaviors</h3>
          <div className='space-y-3 max-h-[28rem] overflow-auto'>
            {behaviors.length === 0 ? <p className='text-sm opacity-60'>No behaviors yet.</p> : behaviors.map((b) => <div key={b.id} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm'><p className='font-semibold'>{b.full_name}</p><p className='opacity-60 mt-1'>{b.source} / {b.behavior_type}</p><p className='opacity-60'>{b.details}</p><p className='mt-1'>Score {b.score}</p></div>)}
          </div>
        </SectionBox>
      </div>
    </PageShell>
  );
}
