import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OrientationStage } from './components/OrientationStage'
import { HomePage } from './pages/HomePage'
import { LiveReadPage } from './pages/LiveReadPage'
import { ReadPage } from './pages/ReadPage'
import { ScanPage } from './pages/ScanPage'
import { ScanResultPage } from './pages/ScanResultPage'
import { VoiceRecordPage } from './pages/VoiceRecordPage'
import { VoiceSuccessPage } from './pages/VoiceSuccessPage'

export default function App() {
  return (
    <BrowserRouter>
      <OrientationStage>
        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[375px] flex-col overflow-x-hidden bg-[#FFF8E7] shadow-[inset_0_0_0_1px_rgba(229,228,231,0.8)]">
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/scan-result" element={<ScanResultPage />} />
          <Route path="/read/:bookId" element={<ReadPage />} />
          <Route path="/live-read" element={<LiveReadPage />} />
          <Route path="/voice-record" element={<VoiceRecordPage />} />
          <Route path="/voice-success" element={<VoiceSuccessPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </OrientationStage>
    </BrowserRouter>
  )
}
