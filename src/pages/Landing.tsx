import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import { BookOpen, Compass, Store, Star, ArrowRight, BookMarked, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const { user, isAuthReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady && user) {
      navigate('/dashboard');
    }
  }, [user, isAuthReady, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <BookOpen size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Lumina</span>
          </div>
          <button
            onClick={handleLogin}
            className="text-sm font-medium bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight"
          >
            Track, Discover, and Trade Books in One Place
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Join the modern reading ecosystem. Log your progress, get AI-powered recommendations, and buy or sell books with a trusted community.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              Start Tracking Free
              <ArrowRight size={20} />
            </button>
            <p className="text-sm text-slate-500 sm:ml-4">No credit card required.</p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need for your reading journey</h2>
            <p className="text-lg text-slate-600">Built for readers who want more than just a list.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookMarked,
                title: 'Intelligent Tracking',
                desc: 'Log your reading progress, rate books, and write reviews. Keep your digital bookshelf organized.',
                color: 'bg-emerald-100 text-emerald-600'
              },
              {
                icon: Compass,
                title: 'AI Recommendations',
                desc: 'Our AI analyzes your reading history to suggest books you will actually love, not just bestsellers.',
                color: 'bg-purple-100 text-purple-600'
              },
              {
                icon: Store,
                title: 'Peer Marketplace',
                desc: 'Buy and sell books directly with other readers. Secure transactions and a trusted reputation system.',
                color: 'bg-orange-100 text-orange-600'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-wrap justify-center gap-12 mb-16">
            {[
              { stat: '50K+', label: 'Books Tracked' },
              { stat: '10K+', label: 'Active Readers' },
              { stat: '5K+', label: 'Books Traded' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-extrabold text-slate-900 mb-2">{s.stat}</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-white text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 text-slate-800 opacity-50">
              <Star size={200} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-center gap-1 mb-6 text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={24} />)}
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium leading-tight mb-8">
                "Lumina completely changed how I read. The recommendations are spot on, and I've saved so much money buying used books from the community."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-12 h-12 rounded-full border-2 border-slate-700" />
                <div className="text-left">
                  <div className="font-semibold">Sarah Jenkins</div>
                  <div className="text-slate-400 text-sm">Avid Reader</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <BookOpen size={20} className="text-blue-600" />
            <span className="text-lg font-bold text-slate-900">Lumina</span>
          </div>
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Lumina. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
