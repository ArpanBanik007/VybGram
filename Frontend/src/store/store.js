// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import postReducer from "../slices/postSlice";
import myDetailsReducer from "../slices/mydetails.slice";

// ✅ Persist configs
const persistPostConfig = { key: "posts", storage };
const persistDetailsConfig = { key: "mydetails", storage };

// ✅ Persist reducers
const persistedPostReducer = persistReducer(persistPostConfig, postReducer);
const persistedMyDetailsReducer = persistReducer(persistDetailsConfig, myDetailsReducer);

export const store = configureStore({
  reducer: {
    posts: persistedPostReducer,
    mydetails: persistedMyDetailsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
