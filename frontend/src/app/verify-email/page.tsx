'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/verify-email?token=${token}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (res.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully!');
                    setTimeout(() => {
                        router.push('/login');
                    }, 3000);
                } else {
                    const data = await res.json();
                    setStatus('error');
                    setMessage(data.detail || 'Verification failed.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Email Verification
                    </h2>
                    <div className="mt-4 text-center">
                        {status === 'loading' && <p className="text-gray-600">Verifying your email...</p>}
                        {status === 'success' && (
                            <div className="text-green-600">
                                <p className="text-lg font-medium">{message}</p>
                                <p className="mt-2 text-sm">Redirecting to login...</p>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="text-red-600">
                                <p className="text-lg font-medium">{message}</p>
                                <p className="mt-4">
                                    <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                        Back to Login
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
