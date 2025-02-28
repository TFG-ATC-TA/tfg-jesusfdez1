'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { SessionWarningModal } from "@/components/modals/session-warning-modal";
import { SessionExpiredModal } from "@/components/modals/session-expired-modal";
import { useSession } from "next-auth/react";

// Read timeout values from environment variables with fallbacks
// WARNING_TIMEOUT: time until warning modal appears (5 seconds = 5000ms default)
// EXPIRY_TIMEOUT: time until session expires (10 seconds = 10000ms default)
const WARNING_TIMEOUT = 
    process.env.NEXT_PUBLIC_SESSION_WARNING_TIMEOUT ? 
    parseInt(process.env.NEXT_PUBLIC_SESSION_WARNING_TIMEOUT) : 7 * 24 * 60 * 60 * 1000 - 3600; // 7 days in milliseconds

const EXPIRY_TIMEOUT = 
  process.env.NEXT_PUBLIC_SESSION_EXPIRY_TIMEOUT ? 
  parseInt(process.env.NEXT_PUBLIC_SESSION_EXPIRY_TIMEOUT) : 7 * 24 * 60 * 60 * 1000;

// Local storage keys
const LOGIN_TIMESTAMP_KEY = 'session-login-timestamp';
const WARNING_DISMISSED_KEY = 'session-warning-dismissed';
const SESSION_EXPIRED_KEY = 'session-expired';

interface SessionTimeoutContextType {
  resetTimers: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | null>(null);

export const useSessionTimeout = () => {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error("useSessionTimeout must be used within a SessionTimeoutProvider");
  }
  return context;
};

export const SessionTimeoutProvider = ({ 
  children 
}: { 
  children: React.ReactNode;
}) => {
  const { status } = useSession();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const warningDismissedRef = useRef(false);
  
  // Initialize session when user logs in
  useEffect(() => {
    if (status === "authenticated") {
      const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
      
      if (!loginTimestamp) {
        // Only set the initial login timestamp if it doesn't exist
        const now = Date.now();
        localStorage.setItem(LOGIN_TIMESTAMP_KEY, now.toString());
        localStorage.removeItem(WARNING_DISMISSED_KEY);
        localStorage.removeItem(SESSION_EXPIRED_KEY);
        warningDismissedRef.current = false;
      } else {
        // Load existing state
        warningDismissedRef.current = localStorage.getItem(WARNING_DISMISSED_KEY) === 'true';
        const sessionExpired = localStorage.getItem(SESSION_EXPIRED_KEY) === 'true';
        setShowExpiredModal(sessionExpired);
      }
    } else if (status === "unauthenticated") {
      // Clean up on logout
      localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      localStorage.removeItem(WARNING_DISMISSED_KEY);
      localStorage.removeItem(SESSION_EXPIRED_KEY);
      warningDismissedRef.current = false;
    }
  }, [status]);
  
  // Check session status periodically
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const checkSessionStatus = () => {
      const loginTimestamp = Number(localStorage.getItem(LOGIN_TIMESTAMP_KEY) || '0');
      if (loginTimestamp === 0) return;
      
      const now = Date.now();
      const elapsedTime = now - loginTimestamp;
      const sessionExpired = localStorage.getItem(SESSION_EXPIRED_KEY) === 'true';
      
      // First check if session has expired
      if (elapsedTime >= EXPIRY_TIMEOUT && !sessionExpired) {
        localStorage.setItem(SESSION_EXPIRED_KEY, 'true');
        setShowWarningModal(false);
        setShowExpiredModal(true);
        return;
      }
      
      // Then check if warning should be shown
      if (elapsedTime >= WARNING_TIMEOUT && 
          !warningDismissedRef.current && 
          !sessionExpired && 
          !showWarningModal) {
        setShowWarningModal(true);
      }
    };
    
    // Run check immediately and set up interval
    checkSessionStatus();
    const intervalId = setInterval(checkSessionStatus, 1000);
    
    return () => clearInterval(intervalId);
  }, [status, showWarningModal]);
  
  // Handle warning dismissal
  const handleWarningClose = useCallback(() => {
    setShowWarningModal(false);
    warningDismissedRef.current = true;
    localStorage.setItem(WARNING_DISMISSED_KEY, 'true');
  }, []);
  
  // Reset timers on user activity - IMPORTANT CHANGE: 
  // We no longer reset the login timestamp, only track warning dismissal
  const resetTimers = useCallback(() => {
    // Don't do anything if session has expired
    if (localStorage.getItem(SESSION_EXPIRED_KEY) === 'true') return;
    
    // Just ensure warning dismissed state is persisted
    if (warningDismissedRef.current) {
      localStorage.setItem(WARNING_DISMISSED_KEY, 'true');
    }
    
    // No need to update login timestamp - we want the session to expire
    // after the fixed timeout regardless of user activity
  }, []);
  
  // Set up user activity listeners
  useEffect(() => {
    if (status !== "authenticated") return;
    
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const handleUserActivity = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(resetTimers, 200);
    };
    
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
    };
  }, [status, resetTimers]);
  
  return (
    <SessionTimeoutContext.Provider value={{ resetTimers }}>
      {children}
      <SessionWarningModal 
        isOpen={showWarningModal} 
        onClose={handleWarningClose} 
      />
      <SessionExpiredModal 
        isOpen={showExpiredModal} 
      />
    </SessionTimeoutContext.Provider>
  );
};
