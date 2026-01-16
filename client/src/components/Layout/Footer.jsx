function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-500">
                        <span className="font-medium text-slate-700">ADHARA</span>
                        {' '}&middot; Learning Friction Detection System
                    </div>
                    <div className="text-sm text-slate-500">
                        AI Samasya – ICGAIFE 3.0 | Hackathon Prototype
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
                    This is a demonstration prototype using synthetic data only.
                    Not intended for clinical or diagnostic use.
                </div>
            </div>
        </footer>
    )
}

export default Footer
