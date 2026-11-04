import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RoperoPage } from './RoperoPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RoperoPage />
  </StrictMode>,
)
