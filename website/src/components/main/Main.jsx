import { useState } from "react";
import Add_document from "../main/Add_document"
import Send from "../main/Send"
import PropTypes from "prop-types"

export default function Main({loggedInEmail, onAddDocuments}) {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState([]);

    const handleSendQuery = async (queryText) => {
        if (!queryText.trim()) return;
        
        setIsLoading(true);
        
        //add user question to conversation
        const newConversation = [...conversation, { type: 'question', content: queryText }];
        setConversation(newConversation);
        setQuery('');
        
        try {
            const response = await fetch('http://localhost:4000/rag/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: queryText }),
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error('Failed to query RAG pipeline');
            }

            const result = await response.json();
            console.log('RAG query successful:', result);
            
            //add response
            setConversation(prev => [...prev, { 
                type: 'answer', 
                content: result.answer || result.response || 'No answer received',
                sources: result.sources || result.metadata || []
            }]);
            
        } catch (error) {
            console.error('Query failed:', error);
            setConversation(prev => [...prev, { 
                type: 'answer', 
                content: 'Failed to get response. Please try again.',
                sources: []
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSendQuery(query);
        }
    };

    const hasConversation = conversation.length > 0 || isLoading;

    return (
        <div className="w-full h-screen flex flex-col items-center bg-121212 p-8">
            <div className="w-full max-w-4xl flex flex-col h-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-4xl font-medium">Interactive RAG</p>
                    <p className="text-white/60">Build your own AI knowledge</p>
                </div>
                
                {/* Default State - Input in middle */}
                {!hasConversation && (
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex bg-lightgrey px-2 py-2 rounded-lg gap-4">
                            <Add_document 
                                onAddDocuments={onAddDocuments} 
                                userEmail={loggedInEmail}
                            />
                            <input 
                                type="text" 
                                name="query" 
                                id="query" 
                                value={query}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask your AI..."
                                className="flex-grow pr-4 focus:outline-none bg-transparent text-white"
                            />
                            <Send 
                                onSend={() => handleSendQuery(query)} 
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                )}
                
                {/* Conversation State - Input at bottom */}
                {hasConversation && (
                    <>
                        {/* Conversation Area - Scrollable */}
                        <div className="flex-1 overflow-auto space-y-4 mb-6">
                            {conversation.map((item, index) => (
                                <div key={index} className="w-full">
                                    {item.type === 'question' ? (
                                        //User Question
                                        <div className="mb-4 flex justify-end">
                                            <div className="bg-blue-600 text-white rounded-lg p-4 inline-block max-w-3xl">
                                                <p>{item.content}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        //AI Response
                                        <div className="bg-lightgrey/20 rounded-lg p-4 w-full mb-4">
                                            <div className="mb-4">
                                                <p className="text-white/80 leading-relaxed">{item.content}</p>
                                            </div>
                                            
                                            {/* Sources Section */}
                                            {item.sources && item.sources.length > 0 && (
                                                <div className="border-t border-white/20 pt-4">
                                                    <h4 className="text-md font-medium mb-2 text-white/90">Sources</h4>
                                                    <div className="space-y-2">
                                                        {item.sources.map((source, sourceIndex) => (
                                                            <div key={sourceIndex} className="bg-white/5 rounded p-3">
                                                                {typeof source === 'string' ? (
                                                                    <p className="text-white/70 text-sm">{source}</p>
                                                                ) : (
                                                                    <>
                                                                        {source.chunk_id && (
                                                                            <p className="text-white/90 font-medium text-sm mb-1">
                                                                                📄 {source.chunk_id}
                                                                            </p>
                                                                        )}
                                                                        {source.content && (
                                                                            <p className="text-white/70 text-sm">
                                                                                {source.content.length > 200 
                                                                                    ? `${source.content.substring(0, 200)}...` 
                                                                                    : source.content
                                                                                }
                                                                            </p>
                                                                        )}
                                                                        {source.page && (
                                                                            <p className="text-white/50 text-xs mt-1">
                                                                                Page: {source.page}
                                                                            </p>
                                                                        )}
                                                                        {source.score && (
                                                                            <p className="text-white/50 text-xs">
                                                                                Relevance: {(source.score * 100).toFixed(1)}%
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="text-center">
                                    <p className="text-white/60">Thinking...</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Input Area - Fixed at bottom */}
                        <div className="flex bg-lightgrey px-2 py-2 rounded-lg gap-4">
                            <Add_document 
                                onAddDocuments={onAddDocuments} 
                                userEmail={loggedInEmail}
                            />
                            <input 
                                type="text" 
                                name="query" 
                                id="query" 
                                value={query}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={isLoading ? "Processing..." : "Ask your AI..."} 
                                className="flex-grow pr-4 focus:outline-none bg-transparent text-white"
                                disabled={isLoading}
                            />
                            <Send 
                                onSend={() => handleSendQuery(query)} 
                                isLoading={isLoading}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}


Main.propTypes = {
    loggedInEmail: PropTypes.string.isRequired,
    onAddDocuments: PropTypes.func.isRequired
}