import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BudgetStatusType } from '../types';

interface ProgressRingProps {
  radius?: number;
  strokeWidth?: number;
  progress: number;
  status: BudgetStatusType;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  radius = 54,
  strokeWidth = 8,
  progress,
  status,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const targetOffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  const getStatusColor = () => {
    switch (status) {
      case 'SAFE':
        return '#84CC16'; // Vibrant Lime Accent
      case 'APPROACHING':
        return '#F59E0B'; // Amber
      case 'OVER':
        return '#FF2E93'; // Hot Coral Punch
    }
  };

  const strokeColor = getStatusColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          stroke="currentColor"
          className="text-stone-100 dark:text-neutral-800"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Animated Progress Circle */}
        <motion.circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 1.2, ease: 'easeOut' }
          }
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};
