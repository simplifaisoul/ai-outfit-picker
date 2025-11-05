import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'

export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  return useSelector(selector)
}

export const useAppDispatch = () => useDispatch<AppDispatch>()