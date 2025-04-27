import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10,
    },
  },
};

const pulseVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default function AnimatedLoading() {
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Animation */}
        <motion.div
          className="flex items-center justify-between mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"
            variants={itemVariants}
          />
        </motion.div>

        {/* Board Carousel Animation */}
        <motion.div
          className="flex items-center space-x-2 mb-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full"
            variants={pulseVariants}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-4 min-h-[60px]"
            variants={pulseVariants}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full"
            variants={pulseVariants}
            initial="initial"
            animate="animate"
          />
        </motion.div>

        {/* Phrases Grid Animation */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[...Array(8)].map((_, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-4 h-32"
              variants={itemVariants}
            />
          ))}
        </motion.div>

        {/* Floating Animation */}
        <motion.div
          className="absolute bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
} 