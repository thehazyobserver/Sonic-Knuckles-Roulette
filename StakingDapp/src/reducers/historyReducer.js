import { createSlice } from '@reduxjs/toolkit'
import contractsService from '../services/contractsService';
const historySlice = createSlice({
    name: 'history',
    initialState: "",
    reducers:{
        setHistory(state, action){
            return action.payload
        }
    }
})

export const {setHistory} = historySlice.actions

export const loadHistory = (acc) => {
    return async dispatch =>{
        const history = await contractsService.history(acc)
        dispatch(setHistory(history))
    }
}

export default historySlice.reducer