// src/components/layout/ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";
import { logger } from "../../utils/validation";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    logger.error("React Error Boundary caught error", {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      stack: error.stack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to Sentry
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>💥</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. Don't worry, your
              progress is saved.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack} numberOfLines={10}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <Pressable style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  content: {
    maxWidth: 400,
    alignItems: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  errorDetails: {
    width: "100%",
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent.red,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.text.code,
    fontFamily: "monospace",
    marginBottom: SPACING.sm,
  },
  errorStack: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: COLORS.accent.green,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.inverse,
    letterSpacing: 1,
  },
});

// HOC version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
