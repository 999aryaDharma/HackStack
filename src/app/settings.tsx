// src/app/settings.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Switch,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "../core/theme/constants";
import { useStore } from "../store";

interface SettingItemProps {
  title: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
}

function SettingItem({
  title,
  subtitle,
  value,
  onValueChange,
  onPress,
  showArrow = false,
}: SettingItemProps) {
  const content = (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>

      {onValueChange && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: COLORS.background.tertiary,
            true: COLORS.accent.green,
          }}
          thumbColor={COLORS.text.primary}
        />
      )}

      {showArrow && <Text style={styles.arrow}>›</Text>}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

function SettingSection({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const soundEnabled = useStore((state) => state.soundEnabled);
  const hapticsEnabled = useStore((state) => state.hapticsEnabled);
  const toggleSound = useStore((state) => state.toggleSound);
  const toggleHaptics = useStore((state) => state.toggleHaptics);

  const handleResetProgress = () => {
    // TODO: Implement confirmation dialog
    console.log("Reset progress");
  };

  const handleExportData = () => {
    // TODO: Implement data export
    console.log("Export data");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <SettingSection title="Audio & Feedback">
          <SettingItem
            title="Sound Effects"
            subtitle="Play sounds for swipes and achievements"
            value={soundEnabled}
            onValueChange={toggleSound}
          />
          <SettingItem
            title="Haptic Feedback"
            subtitle="Vibrate on interactions"
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
          />
        </SettingSection>

        <SettingSection title="Gameplay">
          <SettingItem
            title="Default Session Length"
            subtitle="10 cards"
            onPress={() => console.log("Change session length")}
            showArrow
          />
          <SettingItem
            title="Lives Mode"
            subtitle="Currently: Off"
            onPress={() => console.log("Toggle lives mode")}
            showArrow
          />
          <SettingItem
            title="Difficulty Adjustment"
            subtitle="Automatically adjust based on performance"
            value={true}
            onValueChange={() => console.log("Toggle auto difficulty")}
          />
        </SettingSection>

        <SettingSection title="Appearance">
          <SettingItem
            title="Theme"
            subtitle="Dark"
            onPress={() => console.log("Change theme")}
            showArrow
          />
          <SettingItem
            title="Reduce Motion"
            subtitle="Minimize animations"
            value={false}
            onValueChange={() => console.log("Toggle reduce motion")}
          />
        </SettingSection>

        <SettingSection title="Data & Privacy">
          <SettingItem
            title="Export Progress Data"
            onPress={handleExportData}
            showArrow
          />
          <SettingItem
            title="Clear Cache"
            subtitle="Free up storage space"
            onPress={() => console.log("Clear cache")}
            showArrow
          />
        </SettingSection>

        <SettingSection title="Danger Zone">
          <SettingItem
            title="Reset All Progress"
            subtitle="This cannot be undone"
            onPress={handleResetProgress}
            showArrow
          />
        </SettingSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>HackStack v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with code and coffee</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text.primary,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionContent: {
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  footer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.secondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
});
