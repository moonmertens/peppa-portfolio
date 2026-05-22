'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { submitContactForm } from '@/app/(site)/contact/actions'

interface ContactFormProps {
  heading?: string
}

interface FormData {
  name: string
  email: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  'font-sans text-base w-full px-4 py-3 border outline-none transition-colors duration-200'

const labelClass = 'font-sans text-xs uppercase tracking-widest mb-2 block'

export function ContactForm({ heading }: ContactFormProps) {
  const searchParams = useSearchParams()

  // Initialise subject from ?subject= query param on first render
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: searchParams.get('subject') ?? '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formData.name.trim()) errs.name = 'Name is required.'
    if (!formData.email.trim()) {
      errs.email = 'Email is required.'
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!formData.message.trim()) errs.message = 'Message is required.'
    return errs
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    setStatus('submitting')

    const fd = new FormData()
    fd.set('name', formData.name.trim())
    fd.set('email', formData.email.trim())
    fd.set('subject', formData.subject.trim())
    fd.set('message', formData.message.trim())

    startTransition(async () => {
      try {
        const result = await submitContactForm(fd)
        if (result.success) {
          setStatus('success')
        } else {
          setErrorMessage(result.error ?? 'Something went wrong. Please try again.')
          setStatus('error')
        }
      } catch {
        setErrorMessage('Network error. Please check your connection and try again.')
        setStatus('error')
      }
    })
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear the field error when the user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  if (status === 'success') {
    return (
      <div className="py-12">
        <h2
          className="font-serif text-2xl mb-4"
          style={{ color: 'var(--color-ink)' }}
        >
          Message sent
        </h2>
        <p
          className="font-sans text-base leading-relaxed"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          Thank you for reaching out. I&apos;ll get back to you as soon as possible.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1
        className="font-serif text-4xl md:text-5xl mb-10"
        style={{ color: 'var(--color-ink)' }}
      >
        {heading ?? 'Get in touch'}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="mb-6">
          <label
            htmlFor="name"
            className={labelClass}
            style={{ color: 'var(--color-warm-gray)' }}
          >
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            style={{
              borderColor: errors.name ? 'var(--color-warm-accent)' : 'var(--color-muted)',
              backgroundColor: 'transparent',
              color: 'var(--color-ink)',
            }}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-warm-accent)'
            }}
            onBlur={(e) => {
              if (!errors.name) {
                e.currentTarget.style.borderColor = 'var(--color-muted)'
              }
            }}
          />
          {errors.name && (
            <p
              id="name-error"
              role="alert"
              className="font-sans text-xs mt-1"
              style={{ color: 'var(--color-warm-accent)' }}
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mb-6">
          <label
            htmlFor="email"
            className={labelClass}
            style={{ color: 'var(--color-warm-gray)' }}
          >
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            style={{
              borderColor: errors.email ? 'var(--color-warm-accent)' : 'var(--color-muted)',
              backgroundColor: 'transparent',
              color: 'var(--color-ink)',
            }}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-warm-accent)'
            }}
            onBlur={(e) => {
              if (!errors.email) {
                e.currentTarget.style.borderColor = 'var(--color-muted)'
              }
            }}
          />
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="font-sans text-xs mt-1"
              style={{ color: 'var(--color-warm-accent)' }}
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Subject */}
        <div className="mb-6">
          <label
            htmlFor="subject"
            className={labelClass}
            style={{ color: 'var(--color-warm-gray)' }}
          >
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            className={inputClass}
            style={{
              borderColor: 'var(--color-muted)',
              backgroundColor: 'transparent',
              color: 'var(--color-ink)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-warm-accent)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-muted)'
            }}
          />
        </div>

        {/* Message */}
        <div className="mb-8">
          <label
            htmlFor="message"
            className={labelClass}
            style={{ color: 'var(--color-warm-gray)' }}
          >
            Message <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            value={formData.message}
            onChange={handleChange}
            className={inputClass}
            style={{
              borderColor: errors.message ? 'var(--color-warm-accent)' : 'var(--color-muted)',
              backgroundColor: 'transparent',
              color: 'var(--color-ink)',
              resize: 'vertical',
            }}
            aria-describedby={errors.message ? 'message-error' : undefined}
            aria-invalid={!!errors.message}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-warm-accent)'
            }}
            onBlur={(e) => {
              if (!errors.message) {
                e.currentTarget.style.borderColor = 'var(--color-muted)'
              }
            }}
          />
          {errors.message && (
            <p
              id="message-error"
              role="alert"
              className="font-sans text-xs mt-1"
              style={{ color: 'var(--color-warm-accent)' }}
            >
              {errors.message}
            </p>
          )}
        </div>

        {/* Submission error */}
        {status === 'error' && (
          <p
            role="alert"
            className="font-sans text-sm mb-4"
            style={{ color: 'var(--color-warm-accent)' }}
          >
            {errorMessage}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={status === 'submitting' || isPending}
          className="font-sans text-sm uppercase tracking-widest px-8 py-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-cream)',
          }}
          onMouseEnter={(e) => {
            if (status !== 'submitting') {
              e.currentTarget.style.backgroundColor = 'var(--color-warm-accent)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-ink)'
          }}
        >
          {status === 'submitting' ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  )
}
