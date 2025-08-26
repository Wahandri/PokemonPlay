"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslate } from '@/hooks/useTranslate';

export default function HomePage() {
  const router = useRouter();
  const t = useTranslate();
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50">
      <motion.h1
        className="text-5xl font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Pokémon Auto Battle
      </motion.h1>
      <motion.button
        className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xl shadow-lg focus:outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/game')}
      >
        {t('play')}
      </motion.button>
    </main>
  );
}