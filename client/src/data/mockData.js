// Empty data structure - to be populated from backend
export const learners = []

// Reading passages will be loaded from backend
export const readingPassages = []

// Friction level configuration
export const frictionLevels = {
    low: {
        label: 'Low Friction',
        color: '#10B981',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200'
    },
    medium: {
        label: 'Medium Friction',
        color: '#F59E0B',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200'
    },
    high: {
        label: 'High Friction',
        color: '#EF4444',
        bgClass: 'bg-red-50',
        textClass: 'text-red-700',
        borderClass: 'border-red-200'
    }
}

// Category definitions
export const frictionCategories = [
    { id: 'reading', name: 'Reading Friction', color: '#3B82F6' },
    { id: 'attention', name: 'Attention Friction', color: '#8B5CF6' },
    { id: 'memory', name: 'Memory Friction', color: '#EC4899' }
]
