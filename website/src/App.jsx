import { useState } from 'react'
import Sidebar from "./components/sidebar/Sidebar"
import Main from './components/main/Main'
import DocumentWindow from './components/document/document_window'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Settings from './components/settings/setting'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [documents, setDocuments] = useState([])
  const [currentView, setCurrentView] = useState('main') 

  const addDocuments = (newFiles) => {
    const documentsWithDetails = newFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
    }));
    setDocuments(prev => [...prev, ...documentsWithDetails]);
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  if (!isLoggedIn) {
    if (showSignup) {
      return <Signup onSignup={() => setShowSignup(false)} onSwitchToLogin={() => setShowSignup(false)} />
    }
    return <Login onLogin={() => setIsLoggedIn(true)} onSwitchToSignup={() => setShowSignup(true)} />
  }

  const renderMainContent = () => {
    switch(currentView) {
      case 'documents':
        return <DocumentWindow 
                documents={documents} 
                onRemoveDocument={removeDocument}
                onAddDocuments={addDocuments}
              />;
      case 'settings':
        return <Settings />;
      default:
        return <Main onAddDocuments={addDocuments} />;
    }
  };

  return (
    <div className='flex'>
      <Sidebar 
        documents={documents} 
        onRemoveDocument={removeDocument}
        onNavigate={handleNavigate}
        currentView={currentView}
      />
      {renderMainContent()}
    </div>
  )
}

export default App