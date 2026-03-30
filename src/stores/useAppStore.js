import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      isLoading: true,
      mousePosition: { x: 0, y: 0 },
      scrollPosition: 0,
      isNavOpen: false,
      currentPage: 'home',
      notifications: [],
      
      setTheme: (theme) => set({ theme }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setMousePosition: (position) => set({ mousePosition: position }),
      
      setScrollPosition: (position) => set({ scrollPosition: position }),
      
      toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
      
      setNavOpen: (isOpen) => set({ isNavOpen: isOpen }),
      
      setCurrentPage: (page) => set({ currentPage: page }),
      
      addNotification: (notification) => 
        set((state) => ({
          notifications: [
            ...state.notifications, 
            { 
              id: Date.now(), 
              ...notification,
              timestamp: new Date().toISOString()
            }
          ]
        })),
      
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        })),
      
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'bruces-world-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)

export default useAppStore
