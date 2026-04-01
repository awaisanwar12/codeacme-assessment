// src/app/page.tsx
// Public landing page with project brief submission form
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

const BUDGET_OPTIONS = [
  { value: 'UNDER_5K', label: 'Under $5,000' },
  { value: 'FIVE_TO_10K', label: '$5,000 - $10,000' },
  { value: 'TEN_TO_25K', label: '$10,000 - $25,000' },
  { value: 'TWENTY_FIVE_TO_50K', label: '$25,000 - $50,000' },
  { value: 'FIFTY_TO_100K', label: '$50,000 - $100,000' },
  { value: 'OVER_100K', label: 'Over $100,000' },
];

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'No rush - flexible timeline' },
  { value: 'MEDIUM', label: 'Standard - 3-6 months' },
  { value: 'HIGH', label: 'Urgent - 1-3 months' },
  { value: 'URGENT', label: 'Critical - ASAP' },
];

interface FormErrors {
  [key: string]: string;
}

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrors({});
    setErrorMessage('');

    const formData = new FormData(event.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      budgetRange: formData.get('budgetRange'),
      urgency: formData.get('urgency'),
      contactName: formData.get('contactName'),
      contactEmail: formData.get('contactEmail'),
      contactPhone: formData.get('contactPhone'),
      companyName: formData.get('companyName'),
    };

    try {
      const response = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'VALIDATION_ERROR' && result.details) {
          const fieldErrors: FormErrors = {};
          Object.entries(result.details).forEach(([key, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[key] = messages[0] as string;
            }
          });
          setErrors(fieldErrors);
        }
        setErrorMessage(result.message || 'Submission failed. Please try again.');
        setSubmitStatus('error');
        return;
      }

      setSubmitStatus('success');
      event.currentTarget.reset();
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Agency Pipeline</h1>
          <Link href="/login" className="btn btn--outline btn--sm">
            Team Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Project Idea Into Reality
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Submit your project brief and our AI-powered system will analyze your requirements,
            estimate costs, and suggest a tech stack — all within minutes.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <span>⚡ Instant AI Analysis</span>
            <span>🔒 Secure & Confidential</span>
            <span>📊 Cost Estimation</span>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="card">
            <h3 className="text-2xl font-semibold mb-6">Submit Your Project Brief</h3>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">
                  ✓ Brief submitted successfully! We'll review and contact you soon.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Project Title */}
              <div className="form-group">
                <label htmlFor="title" className="label">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`input ${errors.title ? 'input--error' : ''}`}
                  placeholder="e.g., E-commerce Platform Redesign"
                  required
                  minLength={3}
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              {/* Project Description */}
              <div className="form-group">
                <label htmlFor="description" className="label">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={`textarea ${errors.description ? 'input--error' : ''}`}
                  placeholder="Describe your project requirements, goals, and any specific features needed..."
                  required
                  minLength={50}
                  rows={6}
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              {/* Budget & Urgency Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="budgetRange" className="label">
                    Budget Range <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="budgetRange"
                    name="budgetRange"
                    className={`select ${errors.budgetRange ? 'input--error' : ''}`}
                    required
                  >
                    <option value="">Select budget range</option>
                    {BUDGET_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.budgetRange && <p className="form-error">{errors.budgetRange}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="urgency" className="label">
                    Timeline Urgency
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    className="select"
                  >
                    {URGENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="contactName" className="label">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    className={`input ${errors.contactName ? 'input--error' : ''}`}
                    placeholder="John Doe"
                    required
                    minLength={2}
                  />
                  {errors.contactName && <p className="form-error">{errors.contactName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail" className="label">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    className={`input ${errors.contactEmail ? 'input--error' : ''}`}
                    placeholder="john@company.com"
                    required
                  />
                  {errors.contactEmail && <p className="form-error">{errors.contactEmail}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="contactPhone" className="label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    className="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyName" className="label">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    className="input"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn--primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                    </svg>
                    Analyzing Brief...
                  </span>
                ) : (
                  'Submit Brief & Get AI Analysis'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
        <div className="container max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Agency Pipeline - AI-Powered Project Brief Analysis & Pipeline Management</p>
        </div>
      </footer>
    </div>
  );
}