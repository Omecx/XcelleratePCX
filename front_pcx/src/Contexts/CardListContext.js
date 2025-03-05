// CardListContext.js
import { createContext, useContext, useReducer, useEffect } from 'react';

const CardListContext = createContext();

const initialState = {
  windowWidth: window.innerWidth,
  currentPage: 1,
  data: [],
  paginatedData: [],
  totalPages: 0,
};

const cardListReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_WINDOW_WIDTH':
      return { ...state, windowWidth: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_PAGINATED_DATA':
      return { ...state, paginatedData: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
    default:
      return state;
  }
};

export const CardListProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cardListReducer, initialState);

  useEffect(() => {
    function handleResize() {
      dispatch({ type: 'SET_WINDOW_WIDTH', payload: window.innerWidth });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <CardListContext.Provider value={{ state, dispatch }}>
      {children}
    </CardListContext.Provider>
  );
};

export const useCardList = () => {
  return useContext(CardListContext);
};
