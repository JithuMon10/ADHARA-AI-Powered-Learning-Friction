import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

function CategoryBreakdown({ scores }) {
    const data = [
        { name: 'Reading', value: scores.reading, color: '#3B82F6' },
        { name: 'Attention', value: scores.attention, color: '#8B5CF6' },
        { name: 'Memory', value: scores.memory, color: '#EC4899' }
    ]

    return (
        <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Friction Category Breakdown</h3>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                            labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => [`${value}%`, 'Friction Score']}
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Score bars */}
            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                {data.map(({ name, value, color }) => (
                    <div key={name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">{name} Friction</span>
                            <span className="font-medium text-slate-700">{value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${value}%`, backgroundColor: color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CategoryBreakdown
