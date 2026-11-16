import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SessionType, StudySession, StudySessionStats } from '../types/studySession';
import studySessionService from '../services/studySessionService';

export const MODE_DURATIONS: Record<SessionType, number> = {
  pomodoro: 25 * 60,   // 25 minutes = 1500 seconds
  shortBreak: 5 * 60,  // 5 minutes  = 300 seconds
  longBreak: 15 * 60,  // 15 minutes = 900 seconds
  stopwatch: 0,
  manual: 0,
};

export const MODE_LABELS: Record<SessionType, string> = {
  pomodoro: 'Pomodoro',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
  stopwatch: 'Stopwatch',
  manual: 'Manual',
};

const DEFAULT_STATS: StudySessionStats = {
  todayMinutes: 0,
  todayHours: 0,
  todaySessions: 0,
  todayPomodoros: 0,
  totalMinutes: 0,
  totalHours: 0,
  totalPomodoros: 0,
  currentStreak: 0,
  longestStreak: 0,
};

export const useFocusTimer = (initialSubject = 'General Study') => {
  const [mode, setMode] = useState<SessionType>('pomodoro');
  const [subject, setSubject] = useState<string>(initialSubject);
  const [durationSeconds, setDurationSeconds] = useState<number>(MODE_DURATIONS.pomodoro);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(MODE_DURATIONS.pomodoro);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pomodoroCycle, setPomodoroCycle] = useState<number>(0); // 0 to 4

  // Session completion dialog state
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [completedElapsedMinutes, setCompletedElapsedMinutes] = useState<number>(25);
  const [savingSession, setSavingSession] = useState<boolean>(false);

  // Stats & recent history
  const [stats, setStats] = useState<StudySessionStats>(DEFAULT_STATS);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // References for reliable wall-clock calculations across backgrounding
  const targetEndTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const clientSessionIdRef = useRef<string>('');
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) || 'active');

  // Generate unique client session ID for duplicate prevention
  const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Fetch initial stats & recent sessions
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [statsRes, sessionsRes] = await Promise.all([
        studySessionService.getStats(),
        studySessionService.getStudySessions({ limit: 5 }),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (sessionsRes.success) setRecentSessions(sessionsRes.data.sessions);
    } catch (err) {
      console.warn('Failed to fetch study session stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Clean up interval
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Switch mode (Pomodoro, Short Break, Long Break)
  const switchMode = useCallback(
    (newMode: SessionType) => {
      clearTimer();
      const secs = MODE_DURATIONS[newMode] || 1500;
      setMode(newMode);
      setDurationSeconds(secs);
      setRemainingSeconds(secs);
      setIsRunning(false);
      setIsPaused(false);
      targetEndTimeRef.current = null;
      startTimeRef.current = null;
    },
    [clearTimer]
  );

  // Handle completion
  const handleSessionFinished = useCallback(
    (actualSecondsStudied: number) => {
      clearTimer();
      setIsRunning(false);
      setIsPaused(false);
      targetEndTimeRef.current = null;

      const minutes = Math.max(1, Math.round(actualSecondsStudied / 60));
      setCompletedElapsedMinutes(minutes);

      // Only open celebration/save modal for focus/pomodoro sessions
      if (mode === 'pomodoro') {
        setShowCompleteModal(true);
        // Progress cycle: 1/4 -> 2/4 -> 3/4 -> 4/4
        const nextCycle = pomodoroCycle + 1;
        if (nextCycle >= 4) {
          setPomodoroCycle(0);
        } else {
          setPomodoroCycle(nextCycle);
        }
      } else {
        // Break ended, switch back to pomodoro
        switchMode('pomodoro');
      }
    },
    [clearTimer, mode, pomodoroCycle, switchMode]
  );

  // Tick function using wall-clock sync
  const tick = useCallback(() => {
    if (!targetEndTimeRef.current) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));

    if (remaining <= 0) {
      const totalStudied = durationSeconds;
      handleSessionFinished(totalStudied);
      setRemainingSeconds(0);
    } else {
      setRemainingSeconds(remaining);
    }
  }, [durationSeconds, handleSessionFinished]);

  // Handle AppState changes (backgrounding / foregrounding)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returned to foreground: sync with wall clock!
        if (isRunning && targetEndTimeRef.current) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));
          if (remaining <= 0) {
            handleSessionFinished(durationSeconds);
            setRemainingSeconds(0);
          } else {
            setRemainingSeconds(remaining);
          }
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [durationSeconds, handleSessionFinished, isRunning]);

  // Start timer
  const startTimer = useCallback(() => {
    clearTimer();
    const now = Date.now();
    startTimeRef.current = now;
    targetEndTimeRef.current = now + remainingSeconds * 1000;
    clientSessionIdRef.current = generateSessionId();

    setIsRunning(true);
    setIsPaused(false);

    timerIntervalRef.current = setInterval(tick, 1000);
  }, [clearTimer, remainingSeconds, tick]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    clearTimer();
    // Calculate exact remaining seconds before pausing
    if (targetEndTimeRef.current) {
      const now = Date.now();
      const rem = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));
      setRemainingSeconds(rem);
    }
    targetEndTimeRef.current = null;
    setIsRunning(false);
    setIsPaused(true);
  }, [clearTimer, isRunning]);

  // Resume timer
  const resumeTimer = useCallback(() => {
    if (isRunning || remainingSeconds <= 0) return;
    const now = Date.now();
    targetEndTimeRef.current = now + remainingSeconds * 1000;

    setIsRunning(true);
    setIsPaused(false);

    timerIntervalRef.current = setInterval(tick, 1000);
  }, [isRunning, remainingSeconds, tick]);

  // Reset timer
  const resetTimer = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;
    startTimeRef.current = null;
    setRemainingSeconds(durationSeconds);
  }, [clearTimer, durationSeconds]);

  // Complete early (user stops manually and wants to save study credit)
  const completeEarly = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsedSeconds = durationSeconds - remainingSeconds;
    if (elapsedSeconds < 30) {
      // Less than 30s: just reset without logging
      resetTimer();
      return;
    }
    handleSessionFinished(elapsedSeconds);
  }, [durationSeconds, handleSessionFinished, remainingSeconds, resetTimer]);

  // Save completed session to MongoDB
  const saveSession = useCallback(
    async (focusRating = 4, notes = '', sessionTitle?: string) => {
      try {
        setSavingSession(true);
        const res = await studySessionService.createStudySession({
          subject: subject.trim(),
          durationMinutes: completedElapsedMinutes,
          sessionType: mode,
          startTime: startTimeRef.current
            ? new Date(startTimeRef.current).toISOString()
            : new Date().toISOString(),
          focusRating,
          notes,
          title: sessionTitle || `${subject} Focus Session`,
          clientSessionId: clientSessionIdRef.current || generateSessionId(),
          isCompleted: true,
        });

        if (res.success) {
          // Prepend to recent sessions
          setRecentSessions((prev) => [res.data.studySession, ...prev.slice(0, 4)]);
          // Refresh statistics
          await fetchStats();
        }
        setShowCompleteModal(false);
        resetTimer();
      } catch (err) {
        console.warn('Failed to save study session:', err);
        throw err;
      } finally {
        setSavingSession(false);
      }
    },
    [completedElapsedMinutes, fetchStats, mode, resetTimer, subject]
  );

  const dismissCompleteModal = useCallback(() => {
    setShowCompleteModal(false);
    resetTimer();
  }, [resetTimer]);

  return {
    mode,
    subject,
    setSubject,
    remainingSeconds,
    durationSeconds,
    isRunning,
    isPaused,
    pomodoroCycle,
    showCompleteModal,
    completedElapsedMinutes,
    savingSession,
    stats,
    recentSessions,
    loadingStats,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    switchMode,
    completeEarly,
    saveSession,
    dismissCompleteModal,
    fetchStats,
  };
};

export default useFocusTimer;
