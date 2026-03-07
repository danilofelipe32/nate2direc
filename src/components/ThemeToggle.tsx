import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full p-1 flex items-center transition-colors duration-300 focus:outline-none shadow-inner"
      aria-label="Toggle dark mode"
    >
      <motion.div
        className="w-4 h-4 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center"
        animate={{ x: isDarkMode ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDarkMode ? (
          <Moon size={10} className="text-indigo-400" />
        ) : (
          <Sun size={10} className="text-amber-500" />
        )}
      </motion.div>
    </button>
  );
};
