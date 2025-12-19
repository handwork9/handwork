import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import paymentReducer from './slices/paymentSlice';
import favoritesReducer from './slices/favoritesSlice';
import addressReducer from './slices/addressSlice';
import riderReducer from './slices/riderSlice';
import farmerReducer from './slices/farmerSlice';
import buyerReducer from './slices/buyerSlice';
import notificationSettingsReducer from './slices/notificationSettingsSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // Only persist these slices
  whitelist: ['auth', 'payment', 'cart', 'address', 'favorites', 'notificationSettings'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  payment: paymentReducer,
  favorites: favoritesReducer,
  address: addressReducer,
  rider: riderReducer,
  farmer: farmerReducer,
  buyer: buyerReducer,
  notificationSettings: notificationSettingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
