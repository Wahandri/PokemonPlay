"use client";

import clsx from 'clsx';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  className?: string;
}

/**
 * A simple animated progress bar. Pass in the current value and maximum
 * value to compute the percentage. Colour can be customised.
 */
export function ProgressBar({ value, max, color = 'green', className }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500'
  }[color] ?? 'bg-green-500';
  return (
    <div className={clsx('w-full h-3 rounded bg-gray-300', className)}>
      <motion.div
        className={clsx('h-full rounded', barColor)}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}