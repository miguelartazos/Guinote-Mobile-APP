import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ViewProps,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { useOrientationLock } from '../hooks/useOrientationLock';
import type { OrientationLock } from '../hooks/useOrientationLock';

type ScreenContainerProps = ViewProps & {
  children: React.ReactNode;
  orientation?: OrientationLock;
  gradient?: boolean;
  scrollable?: boolean;
  keyboardAware?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  noPadding?: boolean;
  // When true, bypass SafeAreaView to allow full-bleed content (e.g., landscape game)
  unsafe?: boolean;
  header?: React.ReactNode;
};

export function ScreenContainer({
  children,
  style,
  orientation = 'landscape',
  gradient = true,
  scrollable = false,
  keyboardAware = false,
  refreshing,
  onRefresh,
  noPadding = false,
  unsafe = false,
  header,
  ...props
}: ScreenContainerProps) {
  useOrientationLock(orientation);

  const containerStyle = [styles.container, noPadding && styles.noPadding, style];

  const content = (
    <>
      {header && <View style={styles.header}>{header}</View>}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing || false}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </>
  );

  const wrappedContent = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  if (gradient) {
    return (
      <View style={styles.gradientContainer}>
        <View style={styles.gradientOverlay} />
        {unsafe ? (
          <View style={containerStyle} {...props}>
            {wrappedContent}
          </View>
        ) : (
          <SafeAreaView style={containerStyle} {...props}>
            {wrappedContent}
          </SafeAreaView>
        )}
      </View>
    );
  }

  return unsafe ? (
    <View style={containerStyle} {...props}>{wrappedContent}</View>
  ) : (
    <SafeAreaView style={containerStyle} {...props}>
      {wrappedContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: dimensions.screen.paddingHorizontal,
    paddingVertical: dimensions.screen.paddingVertical,
  },
  noPadding: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  gradientContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: dimensions.spacing.lg,
  },
  header: {
    marginBottom: dimensions.spacing.md,
  },
});
