import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle, Flame, Award, Clock } from 'lucide-react-native';
import { useFocusTimer, MODE_LABELS } from '../hooks/useFocusTimer';
import FocusCompleteModal from '../components/FocusCompleteModal';
import { SessionType } from '../types/studySession';
import { Colors } from '../constants/colors';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: Colors.background,
  card: Colors.card,
  cardAlt: Colors.cardSecondary,
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  secondary: Colors.secondary,
  text: Colors.text,
  textMuted: Colors.textMuted,
  border: Colors.border,
  error: Colors.error,
  warning: Colors.warning,
  success: Colors.success,
};

const POPULAR_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'English',
  'Biology',
  'History',
  'Economics',
];

export default function FocusScreen() {
  const router = useRouter();
  const [showCustomSubject, setShowCustomSubject] = useState<boolean>(false);
  const [customSubjectText, setCustomSubjectText] = useState<string>('');

  const {
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
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    switchMode,
    completeEarly,
    saveSession,
    dismissCompleteModal,
  } = useFocusTimer('Mathematics');

  // Format MM:SS
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Progress percentage (0 to 100%)
  const progressPercent = durationSeconds > 0
    ? Math.round(((durationSeconds - remainingSeconds) / durationSeconds) * 100)
    : 0;

  const handleCustomSubjectSubmit = () => {
    if (customSubjectText.trim()) {
      setSubject(customSubjectText.trim());
      setShowCustomSubject(false);
      setCustomSubjectText('');
    }
  };

  const handleResetConfirm = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetTimer },
      ]
    );
  };

  const handleCompleteEarlyConfirm = () => {
    Alert.alert(
      'Finish Session',
      'End this session now and record your study progress?',
      [
        { text: 'Keep Studying', style: 'cancel' },
        { text: 'Finish & Save', onPress: completeEarly },
      ]
    );
  };

  const getThemeColor = () => {
    if (mode === 'shortBreak') return C.secondary;
    if (mode === 'longBreak') return C.success;
    return C.primary;
  };

  const themeColor = getThemeColor();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Timer</Text>
        <View style={styles.headerRight}>
          <Flame size={18} color={C.warning} />
          <Text style={styles.streakText}>{stats.currentStreak}d streak</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Mode Selector Tabs */}
        <View style={styles.modeTabs}>
          {(['pomodoro', 'shortBreak', 'longBreak'] as SessionType[]).map((m) => {
            const active = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeTab, active && { backgroundColor: themeColor + '22', borderColor: themeColor }]}
                onPress={() => switchMode(m)}
                disabled={isRunning}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    active && { color: themeColor, fontWeight: '700' },
                  ]}
                >
                  {MODE_LABELS[m]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subject Selector (only for Pomodoro) */}
        {mode === 'pomodoro' && (
          <View style={styles.subjectContainer}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectLabel}>Subject:</Text>
              <Text style={styles.currentSubjectBadge}>{subject}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
              {POPULAR_SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.subjectChip, subject === s && styles.subjectChipActive]}
                  onPress={() => setSubject(s)}
                  disabled={isRunning}
                >
                  <Text style={[styles.subjectChipText, subject === s && styles.subjectChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.subjectChip}
                onPress={() => setShowCustomSubject(!showCustomSubject)}
                disabled={isRunning}
              >
                <Text style={styles.subjectChipText}>+ Custom</Text>
              </TouchableOpacity>
            </ScrollView>

            {showCustomSubject && (
              <View style={styles.customSubjectRow}>
                <TextInput
                  style={styles.customSubjectInput}
                  placeholder="Enter subject name..."
                  placeholderTextColor={C.textMuted}
                  value={customSubjectText}
                  onChangeText={setCustomSubjectText}
                  onSubmitEditing={handleCustomSubjectSubmit}
                />
                <TouchableOpacity style={styles.customSubjectBtn} onPress={handleCustomSubjectSubmit}>
                  <Text style={styles.customSubjectBtnText}>Set</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Circular Timer Display */}
        <View style={styles.timerWrapper}>
          <View style={[styles.timerCircle, { borderColor: themeColor }]}>
            <Text style={[styles.timeDigits, { color: C.text }]}>{timeFormatted}</Text>
            <Text style={[styles.modeIndicator, { color: themeColor }]}>
              {mode === 'pomodoro' ? 'DEEP FOCUS' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
            </Text>
            {mode === 'pomodoro' && (
              <Text style={styles.progressText}>{progressPercent}% completed</Text>
            )}
          </View>

          {/* Pomodoro 4-Cycle Dots */}
          {mode === 'pomodoro' && (
            <View style={styles.cycleDotsRow}>
              {[0, 1, 2, 3].map((idx) => {
                const filled = idx < pomodoroCycle;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.cycleDot,
                      filled ? { backgroundColor: C.primary } : styles.cycleDotEmpty,
                    ]}
                  />
                );
              })}
              <Text style={styles.cycleText}>
                {pomodoroCycle}/4 to Long Break
              </Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {!isRunning && !isPaused && (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: themeColor }]}
              onPress={startTimer}
              activeOpacity={0.85}
            >
              <Play size={24} color="#fff" fill="#fff" />
              <Text style={styles.mainBtnText}>
                Start {mode === 'pomodoro' ? 'Focus' : 'Break'}
              </Text>
            </TouchableOpacity>
          )}

          {isRunning && (
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={[styles.subBtn, styles.pauseBtn]}
                onPress={pauseTimer}
                activeOpacity={0.8}
              >
                <Pause size={22} color="#fff" fill="#fff" />
                <Text style={styles.subBtnText}>Pause</Text>
              </TouchableOpacity>

              {mode === 'pomodoro' && (
                <TouchableOpacity
                  style={[styles.subBtn, styles.finishEarlyBtn]}
                  onPress={handleCompleteEarlyConfirm}
                  activeOpacity={0.8}
                >
                  <CheckCircle size={20} color={C.success} />
                  <Text style={[styles.subBtnText, { color: C.success }]}>Finish</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isPaused && (
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={[styles.subBtn, { backgroundColor: themeColor }]}
                onPress={resumeTimer}
                activeOpacity={0.8}
              >
                <Play size={20} color="#fff" fill="#fff" />
                <Text style={styles.subBtnText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subBtn, styles.resetBtn]}
                onPress={handleResetConfirm}
                activeOpacity={0.8}
              >
                <RotateCcw size={20} color={C.textMuted} />
                <Text style={[styles.subBtnText, { color: C.textMuted }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Focus Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>📊 Today&apos;s Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Clock size={18} color={C.secondary} />
              <Text style={styles.statValue}>{stats.todayMinutes}m</Text>
              <Text style={styles.statLabel}>Focus Time</Text>
            </View>
            <View style={styles.statItem}>
              <Award size={18} color={C.primary} />
              <Text style={styles.statValue}>{stats.todayPomodoros}</Text>
              <Text style={styles.statLabel}>Pomodoros</Text>
            </View>
            <View style={styles.statItem}>
              <Flame size={18} color={C.warning} />
              <Text style={styles.statValue}>{stats.currentStreak}d</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyCardTitle}>🕒 Recent Focus Sessions</Text>
            {recentSessions.map((s) => (
              <View key={s._id} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <Text style={styles.historySubject}>{s.subject}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.durationMinutes} mins
                  </Text>
                </View>
                <View style={styles.historyRating}>
                  <Text style={styles.historyRatingStars}>
                    {'★'.repeat(s.focusRating || 4)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Completion & Save Modal */}
      <FocusCompleteModal
        visible={showCompleteModal}
        subject={subject}
        durationMinutes={completedElapsedMinutes}
        saving={savingSession}
        onSave={saveSession}
        onDismiss={dismissCompleteModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  streakText: {
    color: C.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 4,
    marginTop: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeTabText: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  subjectContainer: {
    marginBottom: 20,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  currentSubjectBadge: {
    fontSize: 13,
    color: C.primaryLight,
    fontWeight: '700',
    backgroundColor: C.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  subjectScroll: {
    flexDirection: 'row',
  },
  subjectChip: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  subjectChipActive: {
    backgroundColor: C.primary + '25',
    borderColor: C.primary,
  },
  subjectChipText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  subjectChipTextActive: {
    color: C.primary,
    fontWeight: '700',
  },
  customSubjectRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  customSubjectInput: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  customSubjectBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSubjectBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  timerWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 5,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  timeDigits: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modeIndicator: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 6,
  },
  cycleDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  cycleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cycleDotEmpty: {
    backgroundColor: C.border,
  },
  cycleText: {
    color: C.textMuted,
    fontSize: 12,
    marginLeft: 6,
  },
  controlsRow: {
    marginVertical: 20,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  subBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  subBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pauseBtn: {
    backgroundColor: C.warning,
  },
  finishEarlyBtn: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.success,
  },
  resetBtn: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  statsCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  statsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
  historyCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  historyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border + '50',
  },
  historyItemLeft: {
    gap: 2,
  },
  historySubject: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  historyTime: {
    fontSize: 12,
    color: C.textMuted,
  },
  historyRating: {
    alignItems: 'flex-end',
  },
  historyRatingStars: {
    color: C.warning,
    fontSize: 13,
  },
});

