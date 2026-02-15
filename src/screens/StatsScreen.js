import React, { useEffect, useState } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useMorningWinStore } from '../store';
import { revenueCatServices } from '../services/revenuecat';
import { format, getDaysInMonth, parseISO } from 'date-fns';

const StatsScreen = ({ navigation }) => {
  const {
    currentStreak,
    bestStreak,
    streakHistory,
    isPro,
    trialEndDate,
    getMonthlyCompletionPercentage,
  } = useMorningWinStore();

  const [showPaywall, setShowPaywall] = useState(!isPro);
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPro) {
      fetchOfferings();
    }
  }, []);

  const fetchOfferings = async () => {
    const offerings_ = await revenueCatServices.getAvailablePackages();
    setOfferings(offerings_);
  };

  const handleStartTrial = async (package_) => {
    setLoading(true);
    const result = await revenueCatServices.startFreeTrial(package_);
    setLoading(false);

    if (result.success) {
      useMorningWinStore.setState({ isPro: true });
      setShowPaywall(false);
    }
  };

  if (showPaywall) {
    return <PaywallScreen offerings={offerings} onStartTrial={handleStartTrial} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Discipline</Text>
      </View>

      {/* Current Streak - HERO */}
      <View style={styles.heroStreak}>
        <Text style={styles.heroEmoji}>🔥</Text>
        <Text style={styles.heroNumber}>{currentStreak}</Text>
        <Text style={styles.heroLabel}>day streak</Text>
      </View>

      {/* Monthly Completion % */}
      <View style={styles.stat}>
        <Text style={styles.statLabel}>This Month</Text>
        <View style={styles.statValue}>
          <Text style={styles.statNumber}>{getMonthlyCompletionPercentage()}%</Text>
          <Text style={styles.statSubtext}>of mornings completed</Text>
        </View>
      </View>

      {/* Best Streak Ever */}
      <View style={styles.stat}>
        <Text style={styles.statLabel}>Best Ever</Text>
        <View style={styles.statValue}>
          <Text style={styles.statNumber}>🏆 {bestStreak}</Text>
          <Text style={styles.statSubtext}>day record</Text>
        </View>
      </View>

      {/* Calendar History */}
      <View style={styles.calendarSection}>
        <Text style={styles.calendarTitle}>Calendar</Text>
        <CalendarGrid streakHistory={streakHistory} />
      </View>

      {/* Pro Badge */}
      {isPro && (
        <View style={styles.proCard}>
          <Text style={styles.proText}>✨ Pro Member</Text>
          {trialEndDate && (
            <Text style={styles.trialText}>
              Trial ends {format(parseISO(trialEndDate), 'MMM d, yyyy')}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const PaywallScreen = ({ offerings, onStartTrial }) => {
  const monthlyPackage = offerings?.current?.monthly;
  const yearlyPackage = offerings?.current?.annual;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.paywallContent}>
        {/* Header */}
        <View style={styles.paywallHeader}>
          <Text style={styles.paywallTitle}>Win your mornings.</Text>
          <Text style={styles.paywallSubtitle}>
            People who track their mornings stay consistent 3x longer.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <BenefitItem text="See your streak history" />
          <BenefitItem text="Recover missed days" />
          <BenefitItem text="Build custom routines" />
          <BenefitItem text="Track monthly discipline" />
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          {monthlyPackage && (
            <TouchableOpacity
              style={styles.pricingOption}
              onPress={() => onStartTrial(monthlyPackage)}
            >
              <Text style={styles.pricingLabel}>Monthly</Text>
              <Text style={styles.pricingPrice}>{monthlyPackage.product.priceString}</Text>
              <Text style={styles.pricingSubtext}>/month</Text>
            </TouchableOpacity>
          )}

          {yearlyPackage && (
            <TouchableOpacity
              style={[styles.pricingOption, styles.pricingOptionHighlight]}
              onPress={() => onStartTrial(yearlyPackage)}
            >
              <Text style={styles.pricingLabel}>Yearly</Text>
              <Text style={styles.pricingPrice}>{yearlyPackage.product.priceString}</Text>
              <Text style={styles.pricingSubtext}>/year</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Best Value</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => onStartTrial(monthlyPackage || yearlyPackage)}
        >
          <Text style={styles.ctaText}>Start 3-day free trial</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Cancel anytime. No charges before trial ends.
        </Text>
      </View>
    </ScrollView>
  );
};

const BenefitItem = ({ text }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitCheckmark}>✔️</Text>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const CalendarGrid = ({ streakHistory }) => {
  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  const year = today.getFullYear();
  const month = today.getMonth();

  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const completed = streakHistory[dateStr];
    days.push({
      day,
      completed,
      dateStr,
    });
  }

  return (
    <View style={styles.calendarGrid}>
      {days.map((item) => (
        <View
          key={item.dateStr}
          style={[
            styles.calendarDay,
            item.completed === true && styles.calendarDayCompleted,
            item.completed === false && styles.calendarDayMissed,
            item.completed === undefined && styles.calendarDayEmpty,
          ]}
        >
          <Text style={styles.calendarDayText}>{item.day}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  heroStreak: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  heroEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  heroNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#000',
  },
  heroLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  stat: {
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: '14%',
    aspectRatio: 1,
    backgroundColor: '#eee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayCompleted: {
    backgroundColor: '#00ff00',
  },
  calendarDayMissed: {
    backgroundColor: '#ff4444',
  },
  calendarDayEmpty: {
    backgroundColor: '#f5f5f5',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  proCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  proText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  trialText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Paywall styles
  paywallContent: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  paywallHeader: {
    marginBottom: 40,
  },
  paywallTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  paywallSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  benefits: {
    marginBottom: 40,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitCheckmark: {
    fontSize: 20,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pricingSection: {
    gap: 12,
    marginBottom: 30,
  },
  pricingOption: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
  },
  pricingOptionHighlight: {
    borderColor: '#000',
    backgroundColor: '#f0f0f0',
  },
  pricingLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  pricingSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  saveBadge: {
    marginTop: 8,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  ctaButton: {
    paddingVertical: 16,
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default StatsScreen;
