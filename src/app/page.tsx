

// src/app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Wand2, Rocket, Heart, Award, Palette } from 'lucide-react';

// You can create a component for this if you reuse it
const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-bold">{title}</h3>
    <p className="text-muted-foreground">{children}</p>
  </div>
);

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center px-4 py-20 text-center sm:py-32">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Turn Your Memories into <span className="text-primary">Tangible Keepsakes</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Create custom, high-quality 3D printed keychains from any image. A unique way to carry your favorite moments with you, everywhere you go.
        </p>
        <div className="mt-10">
          <Link
            href="/ImageConvertor"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-lg transition-transform duration-200 ease-in-out hover:scale-105"
          >
            Create Your Keychain Now
          </Link>
        </div>
      </section>

      {/* Hero Image / Product Showcase */}
      <section className="container mx-auto px-4">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border shadow-2xl">
          {/* TODO: Replace with a high-quality photo of your keychains */}
          <Image
            src="/Logo-light.png"
            alt="Showcase of various 3D printed keychains"
            width={1200}
            height={600}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-24 sm:py-32">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">It's as Easy as 1, 2, 3</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">From a simple image to a stunning keychain in minutes.</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <FeatureCard icon={<Upload className="h-6 w-6 text-primary" />} title="1. Upload Your Image">
            Choose any photo, logo, or design. Our tool supports various formats and helps you tailor it perfectly.
          </FeatureCard>
          <FeatureCard icon={<Wand2 className="h-6 w-6 text-primary" />} title="2. Customize & Preview">
            Our powerful online converter instantly generates the black & white model. Tweak settings to make it uniquely yours.
          </FeatureCard>
          <FeatureCard icon={<Rocket className="h-6 w-6 text-primary" />} title="3. We Print & Ship">
            We use state-of-the-art printers and durable materials to bring your creation to life and ship it right to your door.
          </FeatureCard>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-secondary/50 py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose Keychain Forge?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">We are obsessed with quality and detail.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard icon={<Award className="h-6 w-6 text-primary" />} title="Premium Materials">
              We use high quality PLA for keychains that are built to last and feel great in your hand.
            </FeatureCard>
            <FeatureCard icon={<Palette className="h-6 w-6 text-primary" />} title="Easy">
              Thanks to our conversion tool generating your ideal keychain has never been easier.
            </FeatureCard>
            <FeatureCard icon={<Heart className="h-6 w-6 text-primary" />} title="The Perfect Gift">
              Create a truly personal and memorable gift for birthdays, anniversaries, or any special occasion.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-24 sm:py-32">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Create Your Masterpiece?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Unleash your creativity and design a keychain that's 100% you.</p>
          <div className="mt-8">
            <Link
              href="/ImageConvertor"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-lg transition-transform duration-200 ease-in-out hover:scale-105"
            >
              Start Designing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
