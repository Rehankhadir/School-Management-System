import { useCountUp } from '@/hooks/useCountUp';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; isUp: boolean };
  delay?: number;
}

export function StatCard({ label, value, prefix = '', suffix = '', icon, iconBg, trend, delay = 0 }: StatCardProps) {
  const animatedValue = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow duration-300 group"
      style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{label}</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#111827' }}>
            {prefix}{animatedValue.toLocaleString()}{suffix}
          </p>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', fontWeight: 500, color: trend.isUp ? '#059669' : '#e11d48' }}>
              {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{trend.value}% vs last month</span>
            </div>
          )}
        </div>
        <div
          className={['w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', iconBg].join(' ')}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
