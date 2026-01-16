import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

function UserComplete() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card text-center py-16">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Assessment Complete
                </h1>

                <p className="text-slate-600 max-w-md mx-auto mb-8">
                    Thank you for completing the learning task.
                    Your responses have been recorded and will be reviewed by an educator.
                </p>

                <Link to="/user" className="btn-primary">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    )
}

export default UserComplete
