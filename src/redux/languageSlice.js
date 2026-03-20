import {createSlice} from '@reduxjs/toolkit';

const languageSlice = createSlice({
  name: 'language',
  initialState: {selectedLang: 0, isSelectedLang: false, provider: false},
  reducers: {
    setLanguage(state, action) {
      state.selectedLang = action.payload;
      state.isSelectedLang = true;
    },
    setProvider(state, action) {
      state.provider = action.payload;
    },
  },
});

export const {setLanguage, setProvider} = languageSlice.actions;
export default languageSlice.reducer;
