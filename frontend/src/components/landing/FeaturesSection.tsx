"use client";

import { motion } from "framer-motion";
import { Zap, MapPin, Shield } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "AI-Powered Matching",
      description:
        "Advanced algorithms analyze your skills, location, and preferences to find perfect opportunities that match your profile in real-time.",
    },
    {
      icon: MapPin,
      title: "Hyperlocal Discovery",
      description:
        "Discover gigs within walking distance. Our platform prioritizes nearby opportunities in your neighborhood for maximum convenience.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description:
        "Every user and business is verified. Secure payments, ratings, and reviews ensure reliable connections you can trust.",
    },
  ];

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to
            <br />
            <span className="text-primary">succeed locally</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed to help you find, manage, and succeed at
            gigs with cutting-edge AI and a focus on local communities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-card rounded-2xl p-8 border border-border hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
