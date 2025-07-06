import addPostIcon from "../assets/add-post.png"
import sendIcon from "../assets/send.png"

function Main() {
    return (
        <div className="relative w-full h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-4xl font-medium">Interactive RAG</p>
            <p className="text-white/60">Build your own AI knowledge</p>
            <div className="flex bg-lightgrey px-3 py-4 rounded-lg gap-5">
                <img className="w-6 cursor-pointer" src={addPostIcon} alt="" />
                <input type="text" name="query" id="query" placeholder="Ask your AI..." className="flex-grow pr-120 focus:outline-none"/>
                <img className="w-6 cursor-pointer" src={sendIcon} alt="" />
            </div>
            <button className="bg-blue-600 px-6 py-1.5 rounded-md absolute right-6 top-3 cursor-pointer" type="button">Login</button>
        </div>
    )
}

export default Main