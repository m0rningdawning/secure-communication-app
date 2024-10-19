"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
 const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true); 
    const timeout = setTimeout(() => setLoading(false), 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname]); 

  return (
    <>
      {loading && <div className="loading-spinner"></div>}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
    // <AnimatePresence mode="sync">
    //   <motion.div
    //     key={pathname}
    //     initial={{ opacity: 0 }}
    //     animate={{ opacity: 1 }}
    //     exit={{ opacity: 0 }}
    //     transition={{ duration: 0.5 }}
    //   >
    //     {children}
    //   </motion.div>
    // </AnimatePresence>
  );
};

export default PageTransition;
