import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { DashboardHeader } from '../components/DashboardHeader';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { RoadmapCard } from '../components/RoadmapCard';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { Layers, Terminal, CheckCircle2 } from 'lucide-react-native';

export default function DashboardScreen() {
  const {
    status,
    data,
    error,
    latency,
    apiUrl,
    setApiUrl,
    checkHealth,
  } = useBackendHealth();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header with App Branding */}
        <DashboardHeader />

        {/* Backend Connection & Diagnostics Indicator */}
        <ConnectionIndicator
          status={status}
          data={data}
          error={error}
          latency={latency}
          apiUrl={apiUrl}
          onUrlChange={setApiUrl}
          onRetry={() => checkHealth()}
        />

        {/* System Stack Verification Card */}
        <View style={styles.stackCard}>
          <View style={styles.cardTitleRow}>
            <Layers size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>Verified Technology Stack</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Initialized and verified for Day 1
          </Text>

          <View style={styles.chipsContainer}>
            <View style={styles.chip}>
              <CheckCircle2 size={13} color={Colors.success} />
              <Text style={styles.chipText}>Expo SDK 58 (Router)</Text>
            </View>
            <View style={styles.chip}>
              <CheckCircle2 size={13} color={Colors.success} />
              <Text style={styles.chipText}>React 19 & RN 0.88</Text>
            </View>
            <View style={styles.chip}>
              <CheckCircle2 size={13} color={Colors.success} />
              <Text style={styles.chipText}>TypeScript</Text>
            </View>
            <View style={styles.chip}>
              <CheckCircle2 size={13} color={Colors.success} />
              <Text style={styles.chipText}>Express 4.21</Text>
            </View>
            <View style={styles.chip}>
              <CheckCircle2 size={13} color={Colors.success} />
              <Text style={styles.chipText}>Mongoose 8.9</Text>
            </View>
            <View style={styles.chip}>
              <CheckCircle2 size={13} color={Colors.success} />
              <Text style={styles.chipText}>Axios & SecureStore</Text>
            </View>
          </View>
        </View>

        {/* Development Instructions Banner */}
        <View style={styles.tipBox}>
          <View style={styles.tipTitleRow}>
            <Terminal size={16} color={Colors.secondary} />
            <Text style={styles.tipTitle}>Testing on Android Phone</Text>
          </View>
          <Text style={styles.tipText}>
            1. Keep your computer and phone on the same Wi-Fi network.{'\n'}
            2. Run backend: <Text style={styles.codeText}>cd backend & npm run dev</Text>{'\n'}
            3. Run frontend: <Text style={styles.codeText}>cd frontend & npm run start</Text>{'\n'}
            4. If using physical device, enter your PC's IP (e.g.{' '}
            <Text style={styles.codeText}>http://192.168.1.X:5000</Text>) in Target API URL above.
          </Text>
        </View>

        {/* Roadmap Preview */}
        <RoadmapCard />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            StudyMate v1.0.0 • College Final Project
          </Text>
          <Text style={styles.footerSubtext}>
            Built with React Native, Node.js & MongoDB Atlas
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  stackCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  tipBox: {
    backgroundColor: 'rgba(34, 211, 238, 0.06)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    marginVertical: 12,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  codeText: {
    color: Colors.text,
    fontFamily: 'monospace',
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  footerSubtext: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});

