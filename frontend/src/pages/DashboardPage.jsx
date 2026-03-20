
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import assets from '../assets/assets';
import PageShell from '../components/PageShell';
import SectionBox from '../components/SectionBox';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../api';

const StatIcon = ({ kind }) => {
  const iconProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-6 w-6',
  };

  if (kind === 'customers') {
    return (
      <svg {...iconProps}>
        <path d='M16 21v-1.5A3.5 3.5 0 0 0 12.5 16H7.5A3.5 3.5 0 0 0 4 19.5V21' />
        <circle cx='10' cy='8' r='3' />
        <path d='M17 11.5a2.5 2.5 0 1 0 0-5' />
        <path d='M20 21v-1.5A3.5 3.5 0 0 0 17.6 16.2' />
      </svg>
    );
  }

  if (kind === 'campaigns') {
    return (
      <svg {...iconProps}>
        <circle cx='12' cy='12' r='7.5' />
        <circle cx='12' cy='12' r='3.5' />
        <path d='M12 2v2.5' />
        <path d='M12 19.5V22' />
        <path d='M22 12h-2.5' />
        <path d='M4.5 12H2' />
      </svg>
    );
  }

  if (kind === 'messages') {
    return (
      <svg {...iconProps}>
        <rect x='3' y='5' width='18' height='14' rx='2.5' />
        <path d='m5 7 7 5 7-5' />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d='M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5' />
      <path d='M10 17a2 2 0 0 0 4 0' />
    </svg>
  );
};

const StatCard = ({ icon, label, value }) => (
  <SectionBox className='h-full p-5 sm:p-6'>
    <div className='flex min-w-0 items-center gap-4'>
      <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15'>
        <StatIcon kind={icon} />
      </div>
      <div className='min-w-0'>
        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>{label}</p>
        <h3 className='mt-1 text-2xl font-semibold leading-none sm:text-3xl'>{value}</h3>
      </div>
    </div>
  </SectionBox>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.dashboard(), api.notifications()])
      .then(([dashboardData, notificationData]) => {
        setData(dashboardData);
        setAlerts(notificationData);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <PageShell title='Dashboard' desc='Stay on top of customer momentum, active campaigns, and conversations ready to move forward.'><ErrorState message={error} /></PageShell>;
  if (!data || alerts === null) return <PageShell title='Dashboard' desc='Stay on top of customer momentum, active campaigns, and conversations ready to move forward.'><LoadingState /></PageShell>;

  const summary = data.summary;

  return (
    <>
      <div className='flex flex-col items-center gap-6 py-20 px-4 sm:px-12 lg:px-24 xl:px-40 text-center w-full overflow-hidden text-gray-700 dark:text-white'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className='inline-flex items-center gap-2 border border-gray-300 p-1.5 pr-4 rounded-full'>
          <img className='w-20' src={assets.group_profile} alt='' />
          <p className='text-xs font-medium'>{summary.notifications} follow-up opportunities ready now</p>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className='text-4xl sm:text-5xl md:text-6xl xl:text-[84px] font-medium xl:leading-[95px] max-w-5xl'>
          Turn customer interest into <span className='bg-gradient-to-r from-[#5044E5] to-[#4d8cea] bg-clip-text text-transparent'>revenue-ready</span> action.
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className='text-sm sm:text-lg font-medium text-gray-500 dark:text-white/75 max-w-4/5 sm:max-w-2xl pb-3'>
          See where buying interest is growing, choose the right campaign faster, and send messages that feel timely, relevant, and human.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className='relative'>
          <img src={assets.hero_img} alt='' className='w-full max-w-6xl' />
          <img src={assets.bgImage1} alt='' className='absolute -top-40 -right-40 sm:-top-100 sm:-right-70 -z-1 dark:hidden' />
        </motion.div>
      </div>

      <PageShell title='Dashboard' desc='A simple view of your customers, campaigns, notifications, and ready-to-review messages.'>
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4'>
          <StatCard icon='customers' label='Customers' value={summary.customers} />
          <StatCard icon='campaigns' label='Campaigns' value={summary.campaigns} />
          <StatCard icon='messages' label='Messages' value={summary.generated_messages} />
          <StatCard icon='notifications' label='Notifications' value={summary.notifications} />
        </div>

        <div className='grid lg:grid-cols-2 gap-6 mt-10'>
          <SectionBox className='p-6'>
            <div className='flex items-center justify-between gap-4 mb-5'>
              <h3 className='text-xl font-semibold'>Top opportunities to follow up</h3>
              <Link to='/notifications' className='text-sm text-primary'>View all</Link>
            </div>
            <div className='space-y-4'>
              {alerts.length === 0 && (
                <div className='border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm opacity-60'>
                  No follow-up opportunity yet.
                </div>
              )}
              {alerts.slice(0, 4).map((alert) => (
                <div key={`${alert.customer_id}-${alert.source}-${alert.behavior_type}`} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4'>
                  <div className='flex justify-between gap-4 text-sm'>
                    <p className='font-semibold'>{alert.full_name}</p>
                    <p className='opacity-60'>Priority {alert.avg_score}</p>
                  </div>
                  <p className='mt-2 text-sm opacity-75'>{alert.company || 'Company not provided'}</p>
                  <p className='mt-2 text-sm opacity-60'>
                    Best next campaign: {alert.suggested_campaign?.name || 'Recommendation coming soon'}
                  </p>
                </div>
              ))}
            </div>
          </SectionBox>

          <SectionBox className='p-6'>
            <div className='flex items-center justify-between gap-4 mb-5'>
              <h3 className='text-xl font-semibold'>Messages ready to review</h3>
              <Link to='/generated-messages' className='text-sm text-primary'>View all</Link>
            </div>
            <div className='space-y-4'>
              {data.recent_messages.map((item) => (
                <div key={item.id} className='border border-gray-200 dark:border-gray-700 rounded-xl p-4'>
                  <div className='flex justify-between gap-4 text-sm'>
                    <p className='font-semibold'>{item.full_name}</p>
                    <p className='opacity-60'>{item.status}</p>
                  </div>
                  <p className='mt-2 text-sm'>{item.subject}</p>
                  <p className='mt-2 text-sm opacity-60'>{item.campaign_name}</p>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      </PageShell>
    </>
  );
}
