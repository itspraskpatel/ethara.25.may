'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const developerEmail = 'Prashant.patel@ethara.ai';

export function BugReportButton() {
  const reportBug = () => {
    const subject = encodeURIComponent('Ethara whiteboard bug report');
    const body = encodeURIComponent('What happened?\n\nSteps to reproduce:\n1. \n2. \n\nDevice/browser:\n');
    window.location.href = `mailto:${developerEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <motion.button
      type="button"
      aria-label={`Report a bug to ${developerEmail}`}
      title={`Report a bug: ${developerEmail}`}
      className="pointer-events-auto fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-[1.3rem] border border-white/80 bg-white/85 text-xl font-black text-rose-600 shadow-[0_20px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl max-sm:left-3"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4, scale: 1.08, rotate: -4 }}
      whileTap={{ scale: 0.92 }}
      onClick={reportBug}
    >
      <span className="sr-only">Report a bug to {developerEmail}</span>
      <AlertCircle size={23} />
    </motion.button>
  );
}
