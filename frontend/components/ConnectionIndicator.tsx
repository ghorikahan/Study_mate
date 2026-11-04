import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Colors } from '../constants/colors';
import { HealthStatus } from '../hooks/useBackendHealth';
import { HealthResponse } from '../types/api';

interface ConnectionIndicatorProps {
  status: HealthStatus;
  data: HealthResponse | null;
  error: string | null;
  latency: number | null;
  apiUrl: string;
  onUrlChange: (newUrl: string) => void;
  onRetry: () => void;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  data,
  error,
  latency,
  apiUrl,
  onUrlChange,
  onRetry,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return Colors.success;
      case 'disconnected':
      case 'error':
        return Colors.error;
      case 'checking':
      default:
        return Colors.warning;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'connected':
        return 'Backend Connected';
      case 'disconnected':
        return 'Backend Disconnected';
      case 'error':
        return 'Connection Error';
      case 'checking':
      default:
        return 'Connecting to Server...';
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      {/* Status Bar Header */}
      <View style={styles.headerRow}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel()}
          </Text>
        </View>

        {latency !== null && (
          <View style={styles.latencyBadge}>
            <Text style={styles.latencyText}>{latency} ms</Text>
          </View>
        )}
      </View>

      {/* Database & Diagnostics if connected */}
      {status === 'connected' && data && (
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>API Status</Text>
            <Text style={styles.detailValueSuccess}>{data.status.toUpperCase()}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>MongoDB Atlas</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: data.database.connected ? Colors.success : Colors.warning,
                },
              ]}
            >
              {data.database.connected
                ? `Connected (${data.database.name || 'db'})`
                : 'Awaiting Atlas URI in .env'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Server Uptime</Text>
            <Text style={styles.detailValue}>{data.uptime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Environment</Text>
            <Text style={styles.detailValue}>{data.environment}</Text>
          </View>
        </View>
      )}

      {/* Error state presentation */}
      {status !== 'connected' && status !== 'checking' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorMessage}>
            {error || 'Make sure backend is running: npm run dev in backend/'}
          </Text>
          <Text style={styles.errorHint}>
            Android Tip: If testing on phone, set URL to your PC's IP (e.g. http://192.168.1.X:5000)
          </Text>
        </View>
      )}

      {/* Editable API URL Configuration */}
      <View style={styles.urlContainer}>
        <Text style={styles.urlLabel}>Target API URL</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={onUrlChange}
            placeholder="http://192.168.1.X:5000"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.retryButton, status === 'checking' && styles.buttonDisabled]}
            onPress={onRetry}
            disabled={status === 'checking'}
            activeOpacity={0.8}
          >
            {status === 'checking' ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Text style={styles.retryButtonText}>Test Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  latencyBadge: {
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  latencyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  detailsBox: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  detailValueSuccess: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorTitle: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  errorMessage: {
    color: Colors.text,
    fontSize: 12,
    marginBottom: 4,
  },
  errorHint: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  urlContainer: {
    marginTop: 4,
  },
  urlLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 13,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ConnectionIndicator;

