'use client';

import {useState} from "react";
import {useAuth} from "@/contexts/auth-context";
import {useRouter} from "next/navigation";

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const {signup} = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signup(email, password, name);

            if (result.success) {
                router.push('/');
            } else {
                setError(result.error || 'Sign up failed.');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Network error. Please try again.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary py-12 px-4 sm:px-6 lg:px-8">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title justify-center text-3xl prose prose-lg text-center">
                        Create your account
                    </h2>
                    {error && (
                        <div className="alert alert-error mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6"
                                 fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="form-control">
                            <label className="floating-label" htmlFor="name">
                                <span className="label-text">Full Name</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Full Name"
                                className="input input-bordered"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-control">
                            <label className="floating-label" htmlFor="username">
                                <span className="label-text">Username</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Username"
                                className="input input-bordered"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-control">
                            <label className="floating-label" htmlFor="email">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Email address"
                                className="input input-bordered"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-control">
                            <label className="floating-label" htmlFor="password">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Password"
                                className="input input-bordered"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-control mt-6">
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>
                    <div className="divider"></div>
                    <div className="text-center">
                        <span className="text-sm">Already have an account? </span>
                        <a href="/sign-in" className="text-sm link link-primary">
                            Sign in
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}