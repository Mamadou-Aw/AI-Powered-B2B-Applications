import React from 'react';
import assets from '../assets/assets';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Footer = ({ theme }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className='bg-slate-50 dark:bg-gray-900 pt-10 sm:pt-10 mt-20 sm:mt-40 px-4 sm:px-10 lg:px-24 xl:px-40'
    >
      <div className='flex justify-between lg:items-center max-lg:flex-col gap-10'>
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className='space-y-5 text-sm text-gray-700 dark:text-gray-400'>
          <img src={theme === 'dark' ? assets.logo_dark : assets.logo} className='w-32 sm:w-44' alt='CRM.AI' />
          <p className='max-w-md'>CRM.AI helps your team turn customer interest into timely campaigns, better follow-ups, and conversations that convert.</p>
          <ul className='flex gap-8'>
            <li><Link className='hover:text-primary' to='/dashboard'>Dashboard</Link></li>
            <li><Link className='hover:text-primary' to='/admin'>Admin</Link></li>
            <li><Link className='hover:text-primary' to='/notifications'>Notifications</Link></li>
            <li><Link className='hover:text-primary' to='/generated-messages'>Messages</Link></li>
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }} className='text-gray-600 dark:text-gray-400'>
          <h3 className='font-semibold text-gray-800 dark:text-gray-100'>Contact us</h3>
          <p className='text-sm mt-2 mb-5 max-w-sm'>Want to see how CRM.AI can support your pipeline? Reach out and we will get back to you.</p>
          <a
            href='mailto:hello@crm.ai?subject=CRM.AI%20Inquiry'
            className='inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm text-white transition-all hover:scale-103'
          >
            Contact CRM.AI <img src={assets.arrow_icon} alt='' className='w-4' />
          </a>
          <p className='mt-4 text-sm opacity-70'>hello@crm.ai</p>
        </motion.div>
      </div>
      <hr className='border-gray-300 dark:border-gray-600 my-6' />
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} viewport={{ once: true }} className='pb-6 text-sm text-gray-500 flex justify-center sm:justify-between gap-4 flex-wrap'>
        <p>Copyright 2026 CRM.AI. All rights reserved.</p>
        <div className='flex items-center justify-between gap-4'>
          <img src={assets.facebook_icon} alt='' />
          <img src={assets.twitter_icon} alt='' />
          <img src={assets.instagram_icon} alt='' />
          <img src={assets.linkedin_icon} alt='' />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Footer;
