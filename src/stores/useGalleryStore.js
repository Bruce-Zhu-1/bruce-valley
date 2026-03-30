import { create } from 'zustand'

const useGalleryStore = create((set, get) => ({
  galleries: [],
  currentGallery: null,
  lightboxImage: null,
  lightboxIndex: -1,
  isLoading: false,
  error: null,
  filter: 'all',
  
  setGalleries: (galleries) => set({ galleries }),
  
  setCurrentGallery: (gallery) => set({ currentGallery: gallery }),
  
  openLightbox: (image, index) =>
    set({
      lightboxImage: image,
      lightboxIndex: index,
    }),
  
  closeLightbox: () =>
    set({
      lightboxImage: null,
      lightboxIndex: -1,
    }),
  
  nextImage: () => {
    const { lightboxIndex, galleries } = get()
    if (galleries.length === 0) return
    const nextIndex = (lightboxIndex + 1) % galleries.length
    set({
      lightboxIndex: nextIndex,
      lightboxImage: galleries[nextIndex],
    })
  },
  
  prevImage: () => {
    const { lightboxIndex, galleries } = get()
    if (galleries.length === 0) return
    const prevIndex = lightboxIndex === 0 ? galleries.length - 1 : lightboxIndex - 1
    set({
      lightboxIndex: prevIndex,
      lightboxImage: galleries[prevIndex],
    })
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  setFilter: (filter) => set({ filter }),
  
  getFilteredGalleries: () => {
    const { galleries, filter } = get()
    if (filter === 'all') return galleries
    return galleries.filter((item) => item.type === filter || item.category === filter)
  },
  
  fetchGalleries: async (githubConfig) => {
    const { setGalleries, setLoading, setError } = get()
    
    setLoading(true)
    setError(null)
    
    try {
      const { fetchGitHubDirectory } = await import('../services/github.js')
      const data = await fetchGitHubDirectory(
        githubConfig.owner,
        githubConfig.repo,
        githubConfig.path || 'galleries'
      )
      
      const galleries = data.map((item) => ({
        id: item.sha || item.name,
        name: item.name,
        url: item.download_url || item.url,
        type: item.name.split('.').pop()?.toLowerCase() || 'image',
        category: item.path?.split('/')[1] || 'general',
      }))
      
      setGalleries(galleries)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  },
}))

export default useGalleryStore
