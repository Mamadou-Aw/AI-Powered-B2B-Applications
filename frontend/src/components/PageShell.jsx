
import React from 'react';
import { motion } from 'motion/react';
import Title from './Title';

const PageShell = ({ title, desc, children }) => {
  return (
    <div className='flex flex-col items-center gap-7 px-4 sm:px-12 lg:px-24 xl:px-40 py-16 text-gray-700 dark:text-white'>
      <Title title={title} desc={desc} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-6xl'
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageShell;
