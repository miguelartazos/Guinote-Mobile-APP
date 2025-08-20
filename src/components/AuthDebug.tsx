import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: '600',
    marginRight: 10,
    minWidth: 120,
  },
  value: {
    flex: 1,
    color: '#666',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
});

export function AuthDebug() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Auth Debug</Text>
        <Text style={styles.value}>Online auth disabled. Running offline.</Text>
      </View>
    </ScrollView>
  );
}
