import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Copy, Check, Send, Sparkles, Clock, Globe } from 'lucide-react';
import TextScatter from '@/components/effects/TextScatter';
import BendingMarquee from '@/components/effects/BendingMarquee';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name (at least 2 characters)'),
  email: z.string().email('Please provide a valid email address'),
  service: z.string().min(1, 'Please select a service or enquiry type'),
  message: z.string().min(10, 'Please share a brief summary of your project (at least 10 characters)')
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const directEmail = 'akashkumarhzb121@gmail.com';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      service: 'Full-Stack Web Development'
    }
  });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(directEmail);
      setCopied(true);
      toast.success('Email copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy automatically. Email: ' + directEmail);
    }
  };

  const getNormalizedEndpoint = (url: string | undefined): string => {
    if (!url) return '';
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/api/contact')) {
      return trimmed;
    }
    // If user provided base origin (e.g. https://portfolio-cxic.onrender.com or http://localhost:5000)
    if (/^https?:\/\/[^/]+$/.test(trimmed)) {
      return `${trimmed}/api/contact`;
    }
    return trimmed;
  };

  const onSubmit = async (values: ContactFormValues) => {
    const endpoint = getNormalizedEndpoint(import.meta.env.VITE_CONTACT_FORM_ENDPOINT);

    if (!endpoint) {
      toast.info(
        'The contact form is not configured. Opening your mail client as fallback.',
        { duration: 6000 }
      );

      const subject = encodeURIComponent(`Project Inquiry: ${values.service} from ${values.name}`);
      const body = encodeURIComponent(
        `Hi Akash,\n\nMy name is ${values.name} (${values.email}).\nI'm interested in: ${values.service}.\n\nProject details:\n${values.message}\n`
      );
      window.location.assign(`mailto:${directEmail}?subject=${subject}&body=${body}`);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data: {
        message?: string;
        errors?: unknown;
        enquiryId?: string;
      } | null = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 502 && data?.enquiryId) {
          toast.error(
            `Your enquiry was saved (reference ${data.enquiryId}), but the email notification failed. Please email ${directEmail} and include this reference.`,
            { duration: 10000 }
          );
          return;
        }

        let errorMsg = data?.message;
        if (!errorMsg && Array.isArray(data?.errors)) {
          errorMsg = data.errors
            .map((error: unknown) => {
              if (typeof error === 'string') return error;
              if (error && typeof error === 'object' && 'message' in error) {
                return String(error.message);
              }
              return '';
            })
            .filter(Boolean)
            .join('; ');
        } else if (!errorMsg && data?.errors && typeof data.errors === 'object') {
          errorMsg = Object.values(data.errors)
            .flat()
            .filter((error): error is string => typeof error === 'string')
            .join('; ');
        }
        throw new Error(errorMsg || `Submission failed with status ${response.status}`);
      }

      toast.success(data?.message || 'Message delivered successfully! I will reply shortly.');
      reset();
    } catch (err: unknown) {
      if (err instanceof TypeError) {
        toast.error(
          `We couldn't confirm whether your enquiry was received. Check your email before trying again, or contact ${directEmail} directly.`,
          { duration: 10000 }
        );
        return;
      }

      const message = err instanceof Error ? err.message : 'Unknown network failure';
      toast.error(`Unable to send message: ${message}. Please email directly at ${directEmail}`);
    }
  };

  return (
    <section
      id="contact"
      className="section-wrapper relative bg-transparent text-white transition-colors duration-500 overflow-hidden"
      aria-label="Contact and Inquiries"
    >

      <div className="site-container mb-12 sm:mb-16 relative z-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            <TextScatter>Contact</TextScatter>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
            Have an open engineering role, a client project, or want to discuss full-stack architecture? Reach out below or message me directly.
          </p>
        </div>
      </div>

      <div className="site-container relative z-10">
        {/* Contact 11 Architecture: Personal Desk + Enquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Personal Desk */}
          <div className="lg:col-span-5 p-7 sm:p-9 rounded-2xl md:rounded-3xl bg-[#0c0c0e]/95 border border-white/[0.12] shadow-2xl flex flex-col justify-between backdrop-blur-xl">
            <div>
              {/* Personal Avatar Card */}
              <div className="flex items-center gap-4 pb-6 border-b border-white/[0.08]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-500 p-0.5 shadow-md">
                  <div className="w-full h-full bg-[#050505] rounded-[14px] flex items-center justify-center font-extrabold text-xl text-cyan-300">
                    AK
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Akash Kumar</h3>
                  <p className="text-xs font-mono text-cyan-400 font-semibold">Full-Stack & Creative Developer</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-6 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span>Available for selected full-stack projects</span>
              </div>

              {/* Direct email with quick-copy */}
              <div className="mt-6">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                  Direct Inbox
                </label>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] shadow-sm">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <a
                      href={`mailto:${directEmail}`}
                      className="text-sm font-mono text-slate-200 hover:text-cyan-300 transition-colors truncate font-semibold"
                    >
                      {directEmail}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 transition-all flex items-center gap-1 text-xs"
                    aria-label="Copy email address"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Desk Information Details */}
              <div className="mt-6 space-y-3.5 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Timezone: India (IST · UTC+5:30)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Turnaround: Response typically within 24 hours</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Roles: Full-Stack Engineer, Frontend Lead, Creative Dev</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.08] text-xs text-slate-400">
              Backend integration endpoint can be set via <code className="text-cyan-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono">VITE_CONTACT_FORM_ENDPOINT</code>.
            </div>
          </div>

          {/* Right Column: Enquiry Form */}
          <div className="lg:col-span-7 p-7 sm:p-9 rounded-2xl md:rounded-3xl bg-[#0c0c0e]/95 border border-white/[0.12] shadow-2xl backdrop-blur-xl">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
              Send an Enquiry
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Fill in your details below to discuss your project scope, timeline, and goals.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 font-semibold">
                    Your Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="e.g. Akash Kumar"
                    {...register('name')}
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-white placeholder-slate-500 transition-all focus:outline-none shadow-sm ${
                      errors.name ? 'border-rose-500 focus:border-rose-400' : 'border-white/[0.12] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40'
                    }`}
                    aria-invalid={errors.name ? 'true' : 'false'}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-rose-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 font-semibold">
                    Your Email <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="akash@company.com"
                    {...register('email')}
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-white placeholder-slate-500 transition-all focus:outline-none shadow-sm ${
                      errors.email ? 'border-rose-500 focus:border-rose-400' : 'border-white/[0.12] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40'
                    }`}
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label htmlFor="contact-service" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 font-semibold">
                  Service / Interest <span className="text-cyan-400">*</span>
                </label>
                <select
                  id="contact-service"
                  {...register('service')}
                  className="w-full px-4 py-3 rounded-xl bg-[#0c0c0e] border border-white/[0.12] text-sm text-white transition-all focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 shadow-sm font-medium"
                >
                  <option value="Full-Stack Web Development">Full-Stack Web Development (React / Node.js / Express / MongoDB)</option>
                  <option value="Backend Architecture & APIs">Backend Architecture & REST APIs (JWT / RBAC / Security)</option>
                  <option value="UI/UX & Design Systems">UI/UX Implementation & Design Systems (Figma to Code)</option>
                  <option value="3D Interactive Experiences">3D Interactive UI (WebGL / Three.js / Canvas)</option>
                  <option value="Database Design & Cloud Deployment">Database Design & Cloud Deployments (MongoDB Atlas / SQL / Vercel / Render)</option>
                  <option value="Full Project Collaboration">Full Project Collaboration / Consulting</option>
                  <option value="Other">Other / Custom Inquiry</option>
                </select>
                {errors.service && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.service.message}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 font-semibold">
                  Project Summary <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  placeholder="Tell me about your project, target dates, or what you are aiming to build..."
                  {...register('message')}
                  className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-white placeholder-slate-500 transition-all focus:outline-none resize-y shadow-sm ${
                    errors.message ? 'border-rose-500 focus:border-rose-400' : 'border-white/[0.12] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40'
                  }`}
                  aria-invalid={errors.message ? 'true' : 'false'}
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.message.message}</p>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(103,232,249,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <span>Submit Inquiry</span>
                      <Send className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 font-mono">
                  Direct reply · No spam · Response &lt; 24h
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bending Marquee in Contact Section */}
      <div className="mt-16">
        <BendingMarquee
          text=" FULL-STACK · ⚛️ React · 💻 TypeScript · 🟢 Node.js · 🍃 MongoDB · 📝 Express.js · 🌐 Three.js · 🪄 GSAP "
          color="#67e8f9"
          speed={1.8}
        />
      </div>
    </section>
  );
}