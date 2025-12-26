import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { favoritesService, FavoritesResponse } from '../../services/favoritesService';
import { Product } from '../../types';

interface FavoritesState {
  items: Product[];
  favoriteIds: string[]; // Changed from Set to array for proper serialization
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  isToggling: Record<string, boolean>; // Track toggling state per product
  error: string | null;
  lastFetched: number | null;
}

const initialState: FavoritesState = {
  items: [],
  favoriteIds: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  isLoading: false,
  isToggling: {},
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      console.log('[Favorites] Fetching favorites...');
      const response = await favoritesService.getFavorites(page, limit);
      console.log('[Favorites] Response:', JSON.stringify(response));
      return response;
    } catch (error: any) {
      console.log('[Favorites] Error:', error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch favorites');
    }
  }
);

export const fetchFavoriteIds = createAsyncThunk(
  'favorites/fetchFavoriteIds',
  async (_, { rejectWithValue }) => {
    try {
      const ids = await favoritesService.getFavoriteIds();
      return ids;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch favorite IDs');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await favoritesService.toggleFavorite(productId);
      return { productId, isFavorite: response.isFavorite };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle favorite');
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (productId: string, { rejectWithValue }) => {
    try {
      await favoritesService.removeFavorite(productId);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove favorite');
    }
  }
);

export const clearAllFavorites = createAsyncThunk(
  'favorites/clearAllFavorites',
  async (_, { rejectWithValue }) => {
    try {
      await favoritesService.clearAllFavorites();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear favorites');
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    resetFavorites: (state) => {
      state.items = [];
      state.favoriteIds = [];
      state.total = 0;
      state.page = 1;
      state.totalPages = 0;
      state.error = null;
      state.lastFetched = null;
    },
    setFavoriteIds: (state, action: PayloadAction<string[]>) => {
      state.favoriteIds = action.payload;
    },
    // Optimistic update for toggle
    optimisticToggle: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      if (!productId) return;
      const index = state.favoriteIds.indexOf(productId);
      if (index > -1) {
        state.favoriteIds.splice(index, 1);
        state.items = state.items.filter(item => item?.id !== productId);
        state.total = Math.max(0, state.total - 1);
      } else {
        state.favoriteIds.push(productId);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload || {};
        // Filter out any null/undefined items and deduplicate by id
        const validItems = (payload.items || []).filter((item: any) => item != null && item.id != null);
        // Deduplicate items by id
        const uniqueItems = validItems.reduce((acc: Product[], item: Product) => {
          if (!acc.find((existing: Product) => existing.id === item.id)) {
            acc.push(item);
          }
          return acc;
        }, []);
        state.items = uniqueItems;
        state.total = payload.total || uniqueItems.length;
        state.page = payload.page || 1;
        state.limit = payload.limit || 20;
        state.totalPages = payload.totalPages || 0;
        // Deduplicate favoriteIds as well
        state.favoriteIds = [...new Set(uniqueItems.map((item: Product) => item.id))];
        state.lastFetched = Date.now();
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch favorite IDs
    builder
      .addCase(fetchFavoriteIds.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchFavoriteIds.fulfilled, (state, action) => {
        state.favoriteIds = action.payload;
        state.total = action.payload.length;
        state.lastFetched = Date.now();
      })
      .addCase(fetchFavoriteIds.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Toggle favorite
    builder
      .addCase(toggleFavorite.pending, (state, action) => {
        state.isToggling[action.meta.arg] = true;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { productId, isFavorite } = action.payload;
        state.isToggling[productId] = false;
        
        if (isFavorite) {
          if (!state.favoriteIds.includes(productId)) {
            state.favoriteIds.push(productId);
            state.total += 1;
          }
        } else {
          const index = state.favoriteIds.indexOf(productId);
          if (index > -1) {
            state.favoriteIds.splice(index, 1);
          }
          state.items = state.items.filter(item => item?.id !== productId);
          state.total = Math.max(0, state.total - 1);
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.isToggling[action.meta.arg] = false;
        state.error = action.payload as string;
      });

    // Remove favorite
    builder
      .addCase(removeFavorite.pending, (state, action) => {
        state.isToggling[action.meta.arg] = true;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const productId = action.payload;
        if (productId) {
          state.isToggling[productId] = false;
          const index = state.favoriteIds.indexOf(productId);
          if (index > -1) {
            state.favoriteIds.splice(index, 1);
          }
          state.items = state.items.filter(item => item?.id !== productId);
          state.total = Math.max(0, state.total - 1);
        }
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.isToggling[action.meta.arg] = false;
        state.error = action.payload as string;
      });

    // Clear all favorites
    builder
      .addCase(clearAllFavorites.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(clearAllFavorites.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.favoriteIds = [];
        state.total = 0;
        state.totalPages = 0;
      })
      .addCase(clearAllFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetFavorites, setFavoriteIds, optimisticToggle } = favoritesSlice.actions;
export default favoritesSlice.reducer;

// Selectors
export const selectFavorites = (state: { favorites: FavoritesState }) => state.favorites.items;
export const selectFavoriteIds = (state: { favorites: FavoritesState }) => state.favorites.favoriteIds;
export const selectIsFavorite = (productId: string) => (state: { favorites: FavoritesState }) => 
  state.favorites.favoriteIds.includes(productId);
export const selectFavoritesCount = (state: { favorites: FavoritesState }) => state.favorites.total;
export const selectFavoritesLoading = (state: { favorites: FavoritesState }) => state.favorites.isLoading;
export const selectIsToggling = (productId: string) => (state: { favorites: FavoritesState }) => 
  state.favorites.isToggling[productId] || false;
