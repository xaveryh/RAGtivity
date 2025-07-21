function SidebarItem({ icon, text, onClick, isActive = false }) {
    return (
        <div 
            className={`flex items-center gap-3 rounded-md py-2 px-2 cursor-pointer transition-colors ${
                isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-white/7.5 text-white'
            }`}
            onClick={onClick}
        >
            <img src={icon} className="h-6" alt="" />
            <p className="text-lg font-medium">{text}</p>
        </div>
    );
}

export default SidebarItem