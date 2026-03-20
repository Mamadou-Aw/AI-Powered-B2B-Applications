
import React from 'react';

const SectionBox = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-gray-100 dark:shadow-white/10 bg-white dark:bg-gray-900 ${className}`}>
    {children}
  </div>
);

export default SectionBox;
