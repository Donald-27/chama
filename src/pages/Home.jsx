import React from 'react';
import HeroSection from '../components/home/HeroSection';
import IntroSection from '../components/home/IntroSection';
import PhilosophySection from '../components/home/PhilosophySection';
import TeamSection from '../components/home/TeamSection';
import FeaturedBanner from '../components/home/FeaturedBanner';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <IntroSection />
      <PhilosophySection />
      <FeaturedBanner />
      <TeamSection />
    </div>
  );
}