import React from 'react';

export const SkeletonLine = ({ className = "h-4 w-full" }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}></div>
);

export const SkeletonCircle = ({ className = "h-10 w-10" }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-full ${className}`}></div>
);

export const SkeletonRectangle = ({ className = "h-32 w-full rounded-xl" }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 ${className}`}></div>
);
