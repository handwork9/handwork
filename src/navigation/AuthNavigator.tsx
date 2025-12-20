import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import { COLORS } from '../constants/theme';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import MaintenanceScreen from '../screens/auth/MaintenanceScreen';
import WhatYouMissedScreen from '../screens/auth/WhatYouMissedScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import TwoFactorVerificationScreen from '../screens/auth/TwoFactorVerificationScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';

// Multi-step Signup Screens
import {
  SignupRoleScreen,
  SignupEmailScreen,
  SignupPhoneScreen,
  SignupPasswordScreen,
  SignupPersonalInfoScreen,
  SignupNationalityScreen,
  SignupAddressScreen,
  SignupAgreementScreen,
  SignupBikeDetailsScreen,
  SignupGuarantorsScreen,
  SignupFarmDetailsScreen,
  SignupFarmVerificationScreen,
  SignupPaymentScreen,
} from '../screens/auth/signup';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="WhatYouMissed"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
      <Stack.Screen name="WhatYouMissed" component={WhatYouMissedScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="TwoFactorVerification" component={TwoFactorVerificationScreen} />
      
      {/* Multi-step Signup Flow */}
      <Stack.Screen name="SignupRole" component={SignupRoleScreen} />
      <Stack.Screen name="SignupEmail" component={SignupEmailScreen} />
      <Stack.Screen name="SignupPhone" component={SignupPhoneScreen} />
      <Stack.Screen name="SignupPassword" component={SignupPasswordScreen} />
      <Stack.Screen name="SignupPersonalInfo" component={SignupPersonalInfoScreen} />
      <Stack.Screen name="SignupNationality" component={SignupNationalityScreen} />
      <Stack.Screen name="SignupAddress" component={SignupAddressScreen} />
      <Stack.Screen name="SignupAgreement" component={SignupAgreementScreen} />
      {/* Role-specific Signup Screens */}
      <Stack.Screen name="SignupBikeDetails" component={SignupBikeDetailsScreen} />
      <Stack.Screen name="SignupGuarantors" component={SignupGuarantorsScreen} />
      <Stack.Screen name="SignupFarmDetails" component={SignupFarmDetailsScreen} />
      <Stack.Screen name="SignupFarmVerification" component={SignupFarmVerificationScreen} />
      <Stack.Screen name="SignupPayment" component={SignupPaymentScreen} />
    </Stack.Navigator>
  );
}
