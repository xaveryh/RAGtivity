function SidebarItem({ icon, text }) {
    return <>
        <div className="flex items-center gap-3 hover:bg-white/7.5 rounded-md py-2 px-2">
                <img src={icon} className="h-6" alt="asd" />
                <p className="text-lg font-medium">{text}</p>
        </div>
    </>
}

export default SidebarItem