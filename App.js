import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function WeightLossCalculator() {
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [targetDate, setTargetDate] = useState(null); // store as Date object
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [result, setResult] = useState(null);

  // Load saved goalWeight and targetDate on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedGoalWeight = await AsyncStorage.getItem('goalWeight');
        if (savedGoalWeight !== null) {
          setGoalWeight(savedGoalWeight);
        }
        const savedTargetDateStr = await AsyncStorage.getItem('targetDate');
        if (savedTargetDateStr !== null) {
          setTargetDate(new Date(savedTargetDateStr));
        }
      } catch (e) {
        console.log('Failed to load data.');
      }
    };
    loadData();
  }, []);

  // Save goalWeight when it changes
  const onGoalWeightChange = async (weight) => {
    setGoalWeight(weight);
    try {
      await AsyncStorage.setItem('goalWeight', weight);
    } catch (e) {
      console.log('Failed to save goal weight.');
    }
  };

  // Save targetDate when it changes
  const onDateChange = async (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // keep picker open for iOS
    if (selectedDate) {
      setTargetDate(selectedDate);
      try {
        await AsyncStorage.setItem('targetDate', selectedDate.toISOString());
      } catch (e) {
        console.log('Failed to save target date.');
      }
    }
  };

  const calculateLossPerDay = () => {
    const current = parseFloat(currentWeight);
    const goal = parseFloat(goalWeight);
    const target = targetDate;
    const today = new Date();

    if (isNaN(current) || isNaN(goal)) {
      Alert.alert('Please enter valid weights.');
      return;
    }
    if (!target || target <= today) {
      Alert.alert('Please choose a future target date.');
      return;
    }
    if (goal >= current) {
      Alert.alert('Goal weight must be less than current weight.');
      return;
    }

    const diffInTime = target.getTime() - today.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    const totalLoss = (current - goal) * 1000; // Convert kg to grams
    const gramsPerDay = totalLoss / diffInDays;

    setResult(gramsPerDay.toFixed(2));
  };

  // Reset all inputs and storage (except current weight)
  const resetAll = async () => {
    setGoalWeight('');
    setTargetDate(null);
    setResult(null);
    try {
      await AsyncStorage.removeItem('goalWeight');
      await AsyncStorage.removeItem('targetDate');
    } catch (e) {
      console.log('Failed to clear storage.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scott's Weight Loss Calculator</Text>

      <Text>Current Weight (kg):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={currentWeight}
        onChangeText={setCurrentWeight}
        placeholder="e.g. 70"
      />

      <Text>Goal Weight (kg):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={goalWeight}
        onChangeText={onGoalWeightChange}
        placeholder="e.g. 65"
      />

      <Text>Target Date:</Text>
      <Text
        style={[styles.input, styles.dateInput]}
        onPress={() => setShowDatePicker(true)}
      >
        {targetDate ? targetDate.toDateString() : 'Select date'}
      </Text>

      {showDatePicker && (
        <DateTimePicker
          value={targetDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      <Button title="Calculate" onPress={calculateLossPerDay} />

      {result && (
        <Text style={styles.result}>
          You need to lose approximately {result} grams per day.
        </Text>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Reset" color="red" onPress={resetAll} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    marginVertical: 10,
    borderRadius: 5,
  },
  dateInput: {
    paddingVertical: 14,
    color: '#444',
  },
  result: { marginTop: 20, fontSize: 18, fontWeight: '600' },
});

