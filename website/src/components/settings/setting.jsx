import { useState } from 'react';

function Settings() {
  const [aiTone, setAiTone] = useState('professional');
  const [answerLength, setAnswerLength] = useState('medium');

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      window.location.reload();
    }
  };

  const toneOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'technical', label: 'Technical' },
    { value: 'simple', label: 'Simple' }
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
  ];

  return (
    <div className="w-full h-screen bg-121212 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto">

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-white/60">Configure your preferences and account settings</p>
          </div>
        </div>

        <div className="space-y-6">

          <div className="bg-lightgrey rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">LLM Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-white mb-3">AI Tone</label>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAiTone(option.value)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        aiTone === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-white/70 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-lg font-medium text-white mb-3">Answer Length</label>
                <div className="flex flex-wrap gap-2">
                  {lengthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAnswerLength(option.value)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        answerLength === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-white/70 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-start">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;