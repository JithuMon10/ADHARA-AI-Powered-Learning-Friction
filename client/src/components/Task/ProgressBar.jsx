function ProgressBar({ current, total, label }) {
    const percentage = Math.round((current / total) * 100)

    return (
        <div className="w-full">
            {label && (
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-700">{percentage}%</span>
                </div>
            )}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

export default ProgressBar
