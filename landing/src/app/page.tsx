'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Truck, 
  Shield, 
  Star, 
  MapPin, 
  MessageCircle,
  Wallet,
  Bell,
  Menu,
  X,
  Check,
  ArrowRight,
  Users,
  Package,
  Leaf,
  Heart,
  Zap,
  Globe,
  Phone,
  Mail,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Award,
  Headphones
} from 'lucide-react'

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

// Avatar illustration components
function AvatarWoman1({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#8B5A2B"/>
      <ellipse cx="32" cy="38" rx="18" ry="16" fill="#D4A574"/>
      <circle cx="32" cy="26" r="14" fill="#D4A574"/>
      <path d="M18 20c0-10 8-14 14-14s14 4 14 14c0 4-2 6-4 8-4-4-16-4-20 0-2-2-4-4-4-8z" fill="#1a1a1a"/>
      <circle cx="27" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="26" r="2" fill="#1a1a1a"/>
      <path d="M28 32c2 2 6 2 8 0" stroke="#8B4513" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="16" r="3" fill="#FFD700"/>
      <circle cx="40" cy="16" r="3" fill="#FFD700"/>
    </svg>
  )
}

function AvatarFarmer({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#5D4037"/>
      <ellipse cx="32" cy="40" rx="16" ry="14" fill="#8D6E63"/>
      <circle cx="32" cy="28" r="12" fill="#8D6E63"/>
      <ellipse cx="32" cy="12" rx="16" ry="6" fill="#F5DEB3"/>
      <rect x="16" y="10" width="32" height="4" fill="#8B4513"/>
      <circle cx="27" cy="27" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="27" r="2" fill="#1a1a1a"/>
      <path d="M28 33c2 2 6 2 8 0" stroke="#5D4037" strokeWidth="2" strokeLinecap="round"/>
      <rect x="26" y="35" width="12" height="3" rx="1" fill="#5D4037"/>
    </svg>
  )
}

function AvatarArtisan({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#6D4C41"/>
      <ellipse cx="32" cy="40" rx="16" ry="14" fill="#A1887F"/>
      <circle cx="32" cy="26" r="13" fill="#A1887F"/>
      <path d="M16 18c4-8 12-10 16-10s12 2 16 10c-4 4-12 6-16 6s-12-2-16-6z" fill="#4A148C"/>
      <circle cx="27" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="26" r="2" fill="#1a1a1a"/>
      <path d="M28 32c2 2 6 2 8 0" stroke="#6D4C41" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="28" r="4" fill="#FF6B6B"/>
      <circle cx="42" cy="28" r="4" fill="#4ECDC4"/>
    </svg>
  )
}

function AvatarRider({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#3E2723"/>
      <ellipse cx="32" cy="40" rx="16" ry="14" fill="#5D4037"/>
      <circle cx="32" cy="26" r="12" fill="#5D4037"/>
      <ellipse cx="32" cy="14" rx="14" ry="8" fill="#1a1a1a"/>
      <rect x="18" y="12" width="28" height="6" rx="3" fill="#22C55E"/>
      <circle cx="27" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="26" r="2" fill="#1a1a1a"/>
      <path d="M28 32c2 2 6 2 8 0" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function AvatarMan1({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#4E342E"/>
      <ellipse cx="32" cy="40" rx="16" ry="14" fill="#8D6E63"/>
      <circle cx="32" cy="26" r="12" fill="#8D6E63"/>
      <path d="M20 22c0-6 5-10 12-10s12 4 12 10c0 2-1 4-3 5-3-3-6-4-9-4s-6 1-9 4c-2-1-3-3-3-5z" fill="#1a1a1a"/>
      <circle cx="27" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="26" r="2" fill="#1a1a1a"/>
      <path d="M28 32c2 2 6 2 8 0" stroke="#4E342E" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function AvatarWoman2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#A1887F"/>
      <ellipse cx="32" cy="40" rx="16" ry="14" fill="#D7CCC8"/>
      <circle cx="32" cy="26" r="13" fill="#D7CCC8"/>
      <path d="M17 24c0-12 8-16 15-16s15 4 15 16c-4-2-10-3-15-3s-11 1-15 3z" fill="#5D4037"/>
      <circle cx="27" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="26" r="2" fill="#1a1a1a"/>
      <path d="M28 32c2 2 6 2 8 0" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function AvatarMan2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#3E2723"/>
      <ellipse cx="32" cy="40" rx="16" ry="14" fill="#6D4C41"/>
      <circle cx="32" cy="26" r="12" fill="#6D4C41"/>
      <path d="M20 20c0-4 5-8 12-8s12 4 12 8" stroke="#1a1a1a" strokeWidth="4"/>
      <circle cx="27" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="26" r="2" fill="#1a1a1a"/>
      <path d="M28 32c2 2 6 2 8 0" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function AvatarWoman3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#FFCCBC"/>
      <ellipse cx="32" cy="40" rx="16" ry="14" fill="#FFE0B2"/>
      <circle cx="32" cy="26" r="13" fill="#FFE0B2"/>
      <path d="M16 22c2-10 10-14 16-14s14 4 16 14c-4-2-10-4-16-4s-12 2-16 4z" fill="#5D4037"/>
      <circle cx="27" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="37" cy="26" r="2" fill="#1a1a1a"/>
      <path d="M28 32c2 2 6 2 8 0" stroke="#D4A574" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const testimonials = [
    {
      name: 'Amina Johnson',
      role: 'Regular Customer',
      location: 'Lagos, Nigeria',
      avatar: <AvatarWoman1 className="w-full h-full" />,
      content: 'Handwork has completely changed how my family eats. Fresh tomatoes, peppers, and vegetables delivered same day. The quality is incredible!',
      rating: 5
    },
    {
      name: 'Chukwu Emmanuel',
      role: 'Cassava Farmer',
      location: 'Enugu, Nigeria',
      avatar: <AvatarFarmer className="w-full h-full" />,
      content: 'I\'ve been farming for 20 years but never reached this many customers. Handwork gave me a platform to sell directly. My income has tripled!',
      rating: 5
    },
    {
      name: 'Fatima Bello',
      role: 'Craft Artisan',
      location: 'Kano, Nigeria',
      avatar: <AvatarArtisan className="w-full h-full" />,
      content: 'My handwoven baskets and traditional crafts now reach customers across the country. The app is so easy to use and support team is amazing!',
      rating: 5
    },
    {
      name: 'David Okonkwo',
      role: 'Dispatch Rider',
      location: 'Abuja, Nigeria',
      avatar: <AvatarRider className="w-full h-full" />,
      content: 'Flexible hours, good pay, and I get to help my community access fresh food. Best job I\'ve ever had. The app makes deliveries so smooth!',
      rating: 5
    }
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const features = [
    {
      icon: <Leaf className="w-7 h-7" />,
      title: 'Farm Fresh Products',
      description: 'Direct from local farmers. Organic vegetables, fresh fruits, and farm produce delivered within hours of harvest.',
      color: 'bg-green-500'
    },
    {
      icon: <Truck className="w-7 h-7" />,
      title: 'Lightning Fast Delivery',
      description: 'Real-time GPS tracking with our dedicated fleet of riders. Same-day delivery guaranteed.',
      color: 'bg-blue-500'
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Secure Transactions',
      description: 'Bank-grade encryption with escrow protection. Your money is safe until you confirm delivery.',
      color: 'bg-purple-500'
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: 'Direct Communication',
      description: 'Chat directly with farmers and artisans. Video calls available for custom orders.',
      color: 'bg-pink-500'
    },
    {
      icon: <Wallet className="w-7 h-7" />,
      title: 'Smart Wallet',
      description: 'Instant refunds, cashback rewards, and seamless payments. Fund your wallet and shop faster.',
      color: 'bg-orange-500'
    },
    {
      icon: <Award className="w-7 h-7" />,
      title: 'Quality Guaranteed',
      description: 'All sellers are verified. 100% money-back guarantee if products don\'t meet standards.',
      color: 'bg-teal-500'
    }
  ]

  const stats = [
    { value: '10K+', label: 'Happy Customers', icon: <Users className="w-5 h-5" /> },
    { value: '500+', label: 'Verified Sellers', icon: <ShoppingBag className="w-5 h-5" /> },
    { value: '50K+', label: 'Products Listed', icon: <Package className="w-5 h-5" /> },
    { value: '4.9', label: 'App Rating', icon: <Star className="w-5 h-5" /> }
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Download & Sign Up',
      description: 'Get Handwork from Google Play. Create your account in under 60 seconds with just your phone number.',
      icon: <Phone className="w-6 h-6" />
    },
    {
      step: '02',
      title: 'Explore Local Products',
      description: 'Browse thousands of products from verified local farmers, artisans, and service providers near you.',
      icon: <Globe className="w-6 h-6" />
    },
    {
      step: '03',
      title: 'Order & Pay Securely',
      description: 'Add to cart, apply discounts, and checkout with your preferred payment method. Cash on delivery available!',
      icon: <Wallet className="w-6 h-6" />
    },
    {
      step: '04',
      title: 'Track & Receive',
      description: 'Watch your order travel to you in real-time. Rate your experience and earn rewards!',
      icon: <MapPin className="w-6 h-6" />
    }
  ]

  const categories = [
    { name: 'Fresh Vegetables', icon: '🥬', count: '2,500+' },
    { name: 'Fruits', icon: '🍎', count: '1,800+' },
    { name: 'Grains & Cereals', icon: '🌾', count: '950+' },
    { name: 'Meat & Poultry', icon: '🍖', count: '600+' },
    { name: 'Fish & Seafood', icon: '🐟', count: '450+' },
    { name: 'Dairy & Eggs', icon: '🥚', count: '380+' },
    { name: 'Crafts & Art', icon: '🎨', count: '1,200+' },
    { name: 'Spices & Herbs', icon: '🌶️', count: '720+' }
  ]

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center shadow-lg pulse-glow">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">Handwork</span>
                <p className="text-xs text-gray-500 -mt-1">Fresh from the source</p>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition font-medium">Features</a>
              <a href="#categories" className="text-gray-600 hover:text-primary-600 transition font-medium">Categories</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition font-medium">How it Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-primary-600 transition font-medium">Stories</a>
              <a href="#download" className="gradient-bg text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition shadow-lg btn-shine">
                Download Free
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-xl">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-primary-600 font-medium py-2">Features</a>
              <a href="#categories" className="block text-gray-600 hover:text-primary-600 font-medium py-2">Categories</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-primary-600 font-medium py-2">How it Works</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-primary-600 font-medium py-2">Stories</a>
              <a href="#download" className="block gradient-bg text-white px-6 py-3 rounded-full font-semibold text-center mt-4">
                Download Free
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 hero-pattern"></div>
        <div className="absolute inset-0 mesh-gradient"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-40 left-10 w-20 h-20 bg-green-200 rounded-full blur-3xl opacity-60 float-slow"></div>
        <div className="absolute bottom-40 right-10 w-32 h-32 bg-green-300 rounded-full blur-3xl opacity-40 float-animation"></div>
        <div className="absolute top-60 right-1/4 w-16 h-16 bg-yellow-200 rounded-full blur-2xl opacity-50 float-slow"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="fade-in-up">
              <div className="inline-flex items-center gap-2 gradient-bg text-white px-5 py-2 rounded-full text-sm font-semibold mb-8 shadow-lg">
                <Sparkles className="w-4 h-4" />
                Now Live in 15+ Cities
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
                Fresh From
                <span className="gradient-text block">Local Farms</span>
                <span className="text-gray-700">To Your Table</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
                Connect directly with farmers and artisans in your community. 
                <span className="font-semibold text-gray-900"> No middlemen. Better prices. Fresher products.</span>
              </p>
              
              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mb-10">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">100% Verified Sellers</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Same-Day Delivery</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://expo.dev/accounts/bullion9/projects/handwork/builds/f3f6b2aa-2486-4a8b-b806-c12e305aef6f" 
                  target="_blank"
                  className="hover:scale-105 transition-transform shadow-lg rounded-lg overflow-hidden"
                >
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                    alt="Get it on Google Play" 
                    className="h-14 w-auto"
                  />
                </a>
                <div className="relative cursor-not-allowed">
                  <img 
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" 
                    alt="Download on the App Store" 
                    className="h-14 w-auto opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold bg-black/70 px-3 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 mt-10">
                <div className="flex -space-x-3">
                  {[AvatarWoman1, AvatarMan1, AvatarWoman2, AvatarMan2, AvatarWoman3].map((Avatar, i) => (
                    <div key={i} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <Avatar className="w-full h-full" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600"><span className="font-semibold">10,000+</span> happy customers</p>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end slide-in-right">
              <div className="relative">
                {/* Main Phone */}
                <div className="w-80 h-[640px] bg-gray-900 rounded-[3.5rem] p-4 shadow-2xl float-animation">
                  <div className="w-full h-full bg-white rounded-[2.75rem] overflow-hidden relative">
                    {/* Phone Screen Content */}
                    <div className="gradient-bg h-36 flex items-end pb-6 px-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-5 -mb-5"></div>
                      <div className="relative z-10">
                        <p className="text-white/80 text-sm">Good morning! 👋</p>
                        <h3 className="text-white text-2xl font-bold">Discover Fresh</h3>
                      </div>
                    </div>
                    
                    {/* Search bar */}
                    <div className="px-4 -mt-5 relative z-10">
                      <div className="bg-white rounded-2xl shadow-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Search products near you...</span>
                      </div>
                    </div>
                    
                    {/* Categories */}
                    <div className="px-4 mt-4">
                      <div className="flex gap-3 overflow-hidden">
                        {['🥬', '🍎', '🌾', '🐟'].map((emoji, i) => (
                          <div key={i} className="flex-shrink-0 w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-2xl">
                            {emoji}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Product cards */}
                    <div className="p-4 space-y-3">
                      {[
                        { name: 'Fresh Tomatoes', price: '₦500/kg', emoji: '🍅' },
                        { name: 'Organic Spinach', price: '₦300/bunch', emoji: '🥬' },
                        { name: 'Farm Eggs', price: '₦1,800/crate', emoji: '🥚' }
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-2xl p-3 flex gap-3 items-center">
                          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                            {item.emoji}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">Fresh from local farms</p>
                            <p className="text-sm font-bold text-green-600 mt-1">{item.price}</p>
                          </div>
                          <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -left-16 top-24 bg-white rounded-2xl p-4 shadow-2xl float-slow z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">On the way!</p>
                      <p className="text-xs text-gray-500">Arriving in 15 mins</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-12 top-48 bg-white rounded-2xl p-4 shadow-2xl float-animation z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">4.9 Rating</p>
                      <p className="text-xs text-gray-500">12K+ reviews</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -left-8 bottom-40 bg-white rounded-2xl p-4 shadow-2xl float-animation z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">₦5,000 Cashback</p>
                      <p className="text-xs text-gray-500">First order bonus!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4 group-hover:scale-110 transition">
                  <span className="text-white">{stat.icon}</span>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/80 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block gradient-bg text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
              EXPLORE
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From farm-fresh vegetables to handcrafted goods, find everything you need.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="bg-gray-50 hover:bg-green-50 p-6 rounded-3xl text-center card-hover cursor-pointer group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition">{category.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count} products</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block gradient-bg text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
              FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Handwork?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with love for local communities. Every feature designed to make your life easier.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-3xl shadow-sm card-hover group"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block gradient-bg text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
              GET STARTED
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start shopping in less than 2 minutes. It&apos;s that simple.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-gray-50 rounded-3xl p-8 h-full card-hover">
                  <div className="text-7xl font-bold gradient-text opacity-20 mb-4">{item.step}</div>
                  <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition shadow-lg -mt-16">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 3 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 text-green-300 transform -translate-y-1/2 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              SUCCESS STORIES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by Thousands
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real stories from farmers, artisans, and customers across Nigeria.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`bg-gray-800/50 backdrop-blur p-6 rounded-3xl border border-gray-700 card-hover ${activeTestimonial === index ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 text-sm leading-relaxed">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block gradient-bg text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                POWERFUL FEATURES
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Everything in
                <span className="gradient-text"> One App</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Shop, track, chat, pay, and earn rewards. All from your pocket.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: <TrendingUp className="w-6 h-6" />, title: 'Price Comparison', desc: 'Compare prices across sellers instantly' },
                  { icon: <Bell className="w-6 h-6" />, title: 'Smart Alerts', desc: 'Get notified about deals and restocks' },
                  { icon: <Heart className="w-6 h-6" />, title: 'Favorites & Lists', desc: 'Save items and create shopping lists' },
                  { icon: <Headphones className="w-6 h-6" />, title: '24/7 Support', desc: 'We\'re always here to help you' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative flex justify-center">
              <div className="w-72 h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl float-slow">
                <div className="w-full h-full bg-green-50 rounded-[2.5rem] overflow-hidden flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Handwork</h3>
                    <p className="text-gray-600">Fresh from local farms</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-24 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2 rounded-full text-sm font-semibold mb-8">
            <Zap className="w-4 h-4" />
            Join 10,000+ Happy Users
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-shadow">
            Start Shopping
            <br />Fresh Today!
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Download Handwork now and get <span className="font-bold">₦5,000 cashback</span> on your first order. Limited time offer!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
            <a 
              href="https://expo.dev/accounts/bullion9/projects/handwork/builds/f3f6b2aa-2486-4a8b-b806-c12e305aef6f" 
              target="_blank"
              className="hover:scale-105 transition-transform"
            >
              <img 
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                alt="Get it on Google Play" 
                className="h-16 w-auto"
              />
            </a>
            <div className="relative cursor-not-allowed">
              <img 
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" 
                alt="Download on the App Store" 
                className="h-16 w-auto opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-semibold bg-black/70 px-3 py-1 rounded-full">Coming Soon</span>
              </div>
            </div>
          </div>

          <p className="text-white/70 text-sm">
            iOS version launching January 2025. 
            <a href="#" className="underline hover:text-white ml-1">Join the waitlist</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">Handwork</span>
                  <p className="text-sm text-gray-400">Fresh from the source</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm">
                Connecting local farmers, artisans, and communities. Building a sustainable future, one delivery at a time.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Facebook', 'Instagram'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-green-600 transition"
                  >
                    <span className="text-sm font-bold">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Product</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#categories" className="hover:text-white transition">Categories</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Press Kit</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Legal</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Handwork. All rights reserved. Made with 💚 in Nigeria.
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:support@handwork.app" className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" /> support@handwork.app
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-14 h-14 gradient-bg rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition z-50 pulse-glow"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  )
}
