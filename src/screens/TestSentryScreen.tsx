import React from 'react';
import { View, Button, Text, StyleSheet, ScrollView } from 'react-native';
import * as Sentry from '@sentry/react-native';

export const TestSentryScreen = () => {
  // Test different error types
  const testJSError = () => {
    throw new Error('Test JavaScript Error from Guinote2');
  };

  const testAsyncError = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Test Async Error from Guinote2');
  };

  const testSentryCapture = () => {
    try {
      // Simulate some operation
      const result = JSON.parse('invalid json');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          section: 'test',
          action: 'json_parse',
        },
        extra: {
          input: 'invalid json',
          timestamp: new Date().toISOString(),
        },
      });
      alert('Error sent to Sentry!');
    }
  };

  const testBreadcrumbs = () => {
    Sentry.addBreadcrumb({
      message: 'User clicked test button',
      category: 'user-action',
      level: 'info',
      data: {
        buttonId: 'test-breadcrumb',
      },
    });

    Sentry.captureMessage('Test with breadcrumbs', 'info');
    alert('Message with breadcrumbs sent!');
  };

  const testUserContext = () => {
    Sentry.setUser({
      id: 'test-user-123',
      username: 'testuser',
      email: 'test@guinote2.com',
    });

    Sentry.captureMessage('Test with user context', 'info');
    alert('User context set and message sent!');
  };

  const testPerformance = () => {
    const transaction = Sentry.startTransaction({
      name: 'test-game-action',
      op: 'game.play_card',
    });

    const span = transaction.startChild({
      op: 'validate',
      description: 'Validate card play',
    });

    setTimeout(() => {
      span.finish();
      transaction.finish();
      alert('Performance transaction sent!');
    }, 500);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sentry Test Screen</Text>
      <Text style={styles.subtitle}>DSN: Connected to artazos/react-native</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Testing</Text>
        <Button title="Throw JS Error" onPress={testJSError} color="#e74c3c" />
        <Button title="Throw Async Error" onPress={testAsyncError} color="#e74c3c" />
        <Button title="Capture Exception" onPress={testSentryCapture} color="#e67e22" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Context Testing</Text>
        <Button title="Send with Breadcrumbs" onPress={testBreadcrumbs} color="#3498db" />
        <Button title="Set User Context" onPress={testUserContext} color="#3498db" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Testing</Text>
        <Button title="Send Transaction" onPress={testPerformance} color="#27ae60" />
      </View>

      <Text style={styles.info}>
        Check https://sentry.io/organizations/artazos/issues/ to see the results
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  info: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
