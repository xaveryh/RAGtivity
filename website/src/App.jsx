import { useState } from 'react'
import Sidebar from "./components/sidebar/Sidebar"
import Main from './components/main/Main'
import DocumentWindow from './components/document/document_window'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Settings from './components/settings/setting'
import { BrowserRouter, Routes, Route } from 'react-router'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [documents, setDocuments] = useState([])

  const addDocuments = (newFiles) => {
    console.log(newFiles)
    const documentsWithDetails = newFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
    }));
    setDocuments(prev => [...prev, ...documentsWithDetails]);
    console.log(documents)
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  if (!isLoggedIn) {
    if (showSignup) {
      return <Signup onSignup={() => setShowSignup(false)} onSwitchToLogin={() => setShowSignup(false)} />
    }
    return <Login onLogin={() => setIsLoggedIn(true)} onSwitchToSignup={() => setShowSignup(true)} />
  }


  return (
    <BrowserRouter>
      <div className='flex'>
        <Sidebar 
          documents={documents} 
          onRemoveDocument={removeDocument}
        />
          <Routes>
            <Route index element={<Main onAddDocuments={addDocuments}/>} />
            <Route path="/documents" element={<DocumentWindow documents={documents} onRemoveDocument={removeDocument} onAddDocuments={addDocuments}/>} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App