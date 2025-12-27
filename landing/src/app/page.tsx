'use client'

import { useState } from 'react'
import { 
  ShoppingBag, 
  Truck, 
  Shield, 
  Star, 
  MapPin, 
  MessageCircle,
  Wallet,
  Bell,
  ChevronDown,
  Menu,
  X,
  Apple,
  Play,
  Check,
  ArrowRight,
  Users,
  Package,
  Clock
} from 'lucide-react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: 'Fresh Products',
      description: 'Direct from local farmers and artisans. Quality produce delivered fresh to your door.'
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Fast Delivery',
      description: 'Real-time tracking with reliable riders. Know exactly when your order arrives.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Payments',
      description: 'Multiple payment options with buyer protection. Your transactions are safe.'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Direct Chat',
      description: 'Communicate directly with sellers. Ask questions, negotiate, and build relationships.'
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: 'Digital Wallet',
      description: 'Easy payments and quick refunds. Manage your money seamlessly in-app.'
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: 'Smart Notifications',
      description: 'Stay updated on orders, deals, and new products from your favorite sellers.'
    }
  ]

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '500+', label: 'Local Sellers' },
    { value: '50K+', label: 'Products' },
    { value: '99%', label: 'Satisfaction' }
  ]

  const testimonials = [
    {
      name: 'Amina Johnson',
      role: 'Regular Customer',
      content: 'Handwork has transformed how I shop for fresh produce. The quality is unmatched and delivery is always on time!',
      rating: 5
    },
    {
      name: 'Chukwu Emmanuel',
      role: 'Farmer',
      content: 'As a farmer, this platform has helped me reach more customers than ever. My income has doubled since joining.',
      rating: 5
    },
    {
      name: 'Fatima Bello',
      role: 'Artisan',
      content: 'I sell my handmade crafts here and the response has been amazing. The app is easy to use and support is great.',
      rating: 5
    }
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Download the App',
      description: 'Get Handwork from Google Play or App Store. Create your free account in seconds.'
    },
    {
      step: '02',
      title: 'Browse & Discover',
      description: 'Explore products from local farmers, artisans, and service providers near you.'
    },
    {
      step: '03',
      title: 'Order & Pay',
      description: 'Add items to cart, choose payment method, and complete your secure checkout.'
    },
    {
      step: '04',
      title: 'Track & Receive',
      description: 'Track your order in real-time and receive fresh products at your doorstep.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Handwork</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition">How it Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-primary-600 transition">Testimonials</a>
              <a href="#download" className="gradient-bg text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition">
                Download App
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-primary-600">Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-primary-600">How it Works</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-primary-600">Testimonials</a>
              <a href="#download" className="block gradient-bg text-white px-6 py-2 rounded-full font-medium text-center">
                Download App
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-pattern pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="fade-in-up">
              <span className="inline-block gradient-bg text-white px-4 py-1 rounded-full text-sm font-medium mb-6">
                🚀 Now Available on Android
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Local
                <span className="text-primary-600"> Marketplace</span>
                <br />at Your Fingertips
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Connect with local farmers, artisans, and service providers. Fresh produce, quality products, and reliable services delivered to your doorstep.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://play.google.com/store" 
                  target="_blank"
                  className="flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
                >
                  <Play className="w-6 h-6" fill="white" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </a>
                <a 
                  href="#"
                  className="flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-xl opacity-60 cursor-not-allowed"
                >
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Coming soon</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative float-animation">
                <div className="w-72 h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-primary-50 rounded-[2.5rem] overflow-hidden relative">
                    {/* Phone Screen Content */}
                    <div className="gradient-bg h-32 flex items-end pb-4 px-6">
                      <div>
                        <p className="text-white/80 text-sm">Welcome back!</p>
                        <h3 className="text-white text-xl font-bold">Discover Fresh Products</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex gap-3">
                          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-2 bg-gray-100 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-primary-500 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute -left-8 top-20 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Order Delivered!</p>
                      <p className="text-xs text-gray-500">2 mins ago</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 bottom-32 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">4.9 Rating</p>
                      <p className="text-xs text-gray-500">12,000+ reviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-medium">FEATURES</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A complete marketplace solution with all the features to connect buyers and sellers seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-medium">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Simple & Easy Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with Handwork in just a few simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-primary-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
                {index < 3 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 w-8 h-8 text-primary-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-medium">TESTIMONIALS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              What Our Users Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users already enjoying fresh products and quality services. Download Handwork today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://expo.dev/accounts/bullion9/projects/handwork/builds/f3f6b2aa-2486-4a8b-b806-c12e305aef6f" 
              target="_blank"
              className="flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-100 transition font-medium"
            >
              <Play className="w-6 h-6" fill="currentColor" />
              Download for Android
            </a>
          </div>

          <p className="text-white/70 mt-6 text-sm">
            iOS version coming soon. Join the waitlist to be notified.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Handwork</span>
              </div>
              <p className="text-gray-400">
                Your local marketplace for fresh produce and quality services.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How it Works</a></li>
                <li><a href="#testimonials" className="hover:text-white transition">Testimonials</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Handwork. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
