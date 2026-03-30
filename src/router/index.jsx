import { Routes, Route, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import Loading from '../components/common/Loading'

const Home = lazy(() => import('../pages/Home'))
const Diaries = lazy(() => import('../pages/Diaries'))
const Galleries = lazy(() => import('../pages/Galleries'))
const Works = lazy(() => import('../pages/Works'))
const Agent = lazy(() => import('../pages/Agent'))
const Guest = lazy(() => import('../pages/Guest'))

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const PageWrapper = ({ children }) => {
  const location = useLocation()
  
  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>
    <PageWrapper>{children}</PageWrapper>
  </Suspense>
)

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <SuspenseWrapper>
            <Home />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/diaries"
        element={
          <SuspenseWrapper>
            <Diaries />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/galleries"
        element={
          <SuspenseWrapper>
            <Galleries />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/works"
        element={
          <SuspenseWrapper>
            <Works />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/agent"
        element={
          <SuspenseWrapper>
            <Agent />
          </SuspenseWrapper>
        }
      />
      <Route
        path="/guest"
        element={
          <SuspenseWrapper>
            <Guest />
          </SuspenseWrapper>
        }
      />
    </Routes>
  )
}

export default AppRoutes
