import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { setUser, logout, setLoading } from '@/store/slices/userSlice'
import { authService } from '@/services/mockAuth'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, loading } = useAppSelector(state => state.user)

  useEffect(() => {
    dispatch(setLoading(true))
    
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      if (authUser) {
        dispatch(setUser(authUser))
      } else {
        dispatch(logout())
      }
      dispatch(setLoading(false))
    })

    return () => unsubscribe()
  }, [dispatch])

  const handleLogout = async () => {
    try {
      await authService.signOut()
      dispatch(logout())
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    logout: handleLogout
  }
}