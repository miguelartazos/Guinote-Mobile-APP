import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';

export const TestSentry = () => {
  const testError = () => {
    Sentry.captureException(new Error('Test error from Guinote2'));
  };

  const testMessage = () => {
    Sentry.captureMessage('Test message from Guinote2', 'info');
  };

  const testTransaction = () => {
    const transaction = Sentry.startTransaction({
      name: 'test-transaction',
      op: 'test',
    });

    setTimeout(() => {
      transaction.finish();
      Sentry.captureMessage('Transaction completed', 'info');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Button title="Test Sentry Error" onPress={testError} />
      <Button title="Test Sentry Message" onPress={testMessage} />
      <Button title="Test Sentry Transaction" onPress={testTransaction} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
});
