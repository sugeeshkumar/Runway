import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Utensils,
  ShoppingBag,
  Home,
  Zap,
  Car,
  CreditCard,
  Film,
  Heart,
  Tag,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
  animate?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  color = '#64748B',
  size = 16,
  animate = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const lower = (name || '').toLowerCase();

  let IconComponent: React.ComponentType<LucideProps> = Tag;

  if (lower.includes('food') || lower.includes('dining') || lower.includes('restaurant')) {
    IconComponent = Utensils;
  } else if (lower.includes('grocer')) {
    IconComponent = ShoppingBag;
  } else if (lower.includes('hous') || lower.includes('rent')) {
    IconComponent = Home;
  } else if (lower.includes('util') || lower.includes('electric') || lower.includes('gas')) {
    IconComponent = Zap;
  } else if (lower.includes('transp') || lower.includes('uber') || lower.includes('cab')) {
    IconComponent = Car;
  } else if (lower.includes('subscr') || lower.includes('netflix') || lower.includes('cloud')) {
    IconComponent = CreditCard;
  } else if (lower.includes('entertain') || lower.includes('movie')) {
    IconComponent = Film;
  } else if (lower.includes('personal') || lower.includes('health') || lower.includes('doctor')) {
    IconComponent = Heart;
  }

  return (
    <motion.div
      animate={animate && !shouldReduceMotion ? { y: [0, -3, 0] } : { y: 0 }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs"
      style={{
        backgroundColor: `${color}1E`, // Soft tinted background badge
        color: color,
      }}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </motion.div>
  );
};
