import Add_document from "../main/Add_document"
import Send from "../main/Send"

function Main({onAddDocuments}) {
    const handleSendQuery = (query) => {
        console.log('Processing query:', query);
        // Add your query processing logic here
    };

    return (
        <div className="w-full h-screen flex flex-col items-center bg-121212 justify-center gap-4 p-8 overflow-auto">
            <p className="text-4xl font-medium">Interactive RAG</p>
            <p className="text-white/60">Build your own AI knowledge</p>
            <div className="flex bg-lightgrey px-2 py-2 rounded-lg gap-4">
                <Add_document onAddDocuments={onAddDocuments}/>
                <input 
                    type="text" 
                    name="query" 
                    id="query" 
                    placeholder="Ask your AI..." 
                    className="flex-grow pr-120 focus:outline-none"
                />
                <Send onSend={handleSendQuery} />
            </div>
        </div>
    )
}

export default Main