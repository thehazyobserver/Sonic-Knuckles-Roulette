import { configureStore } from '@reduxjs/toolkit'
import accountReducer from './reducers/accountReducer'
//import priceReducer from './reducers/priceReducer'
import historyReducer from './reducers/historyReducer'
import balanceReducer from './reducers/balanceReducer'


const store = configureStore({
    reducer: {
        account: accountReducer,
        balance: balanceReducer,
        history: historyReducer,
        //price: priceReducer,
    }
  })

export default store